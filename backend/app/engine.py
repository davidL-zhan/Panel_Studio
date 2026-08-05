"""SDD §04-llm-protocol §4.5 — 后台讨论引擎"""
import asyncio, random, json
from sqlalchemy import select, func
from .database import AsyncSessionLocal, Discussion, Panelist, Message, ConsensusPoint
from .llm import discussion_turn, extract_consensus, generate_summary, LLMError
from .ws_manager import manager

# 全局暂停事件：discussion_id → asyncio.Event
_pause_events: dict[str, asyncio.Event] = {}


def resume_discussion(discussion_id: str):
    """外部调用：恢复暂停的讨论"""
    evt = _pause_events.get(discussion_id)
    if evt:
        evt.set()


def pause_discussion(discussion_id: str):
    """外部调用：主动暂停讨论"""
    if discussion_id not in _pause_events:
        _pause_events[discussion_id] = asyncio.Event()


async def _build_context(discussion_id: str):
    async with AsyncSessionLocal() as db:
        disc = (await db.execute(select(Discussion).where(Discussion.id == discussion_id))).scalar_one()
        panelists = (await db.execute(
            select(Panelist).where(Panelist.discussion_id == discussion_id).order_by(Panelist.sort_order)
        )).scalars().all()
        msgs = (await db.execute(
            select(Message).where(Message.discussion_id == discussion_id).order_by(Message.sequence)
        )).scalars().all()
        cps = (await db.execute(
            select(ConsensusPoint).where(ConsensusPoint.discussion_id == discussion_id)
        )).scalars().all()

        return disc, list(panelists), list(msgs), list(cps)


def _build_panelist_json(panelists: list[Panelist]) -> str:
    return json.dumps([{
        "id": p.id, "name": p.name, "role": p.role,
        "profession": p.profession, "title": p.title, "stance": p.stance,
    } for p in panelists], ensure_ascii=False)


def _build_transcript_text(msgs: list[Message], panelists: list[Panelist]) -> str:
    pmap = {p.id: p for p in panelists}
    lines = []
    for m in msgs:
        p = pmap.get(m.panelist_id)
        if not p: continue
        role_tag = "主持人" if p.role == "HOST" else p.title
        lines.append(f"[{m.sequence}] {p.name}（{role_tag}）：{m.content}")
    return "\n".join(lines)


def _build_consensus_text(cps: list[ConsensusPoint]) -> str:
    if not cps:
        return "尚无"
    lines = []
    for c in cps:
        tag = "✅" if c.point_type == "CONSENSUS" else "⚠️"
        lines.append(f"{tag} {c.content}")
    return "\n".join(lines)


async def run_discussion_engine(discussion_id: str, stop_event: asyncio.Event):
    """后台讨论引擎。由 POST /start 启动，POST /end 设置 stop_event 停止。"""
    try:
        # 等待上下文就绪
        await asyncio.sleep(0.5)
        disc, panelists, msgs, cps = await _build_context(discussion_id)

        # 推 initial_state 和 discussion_started
        await manager.broadcast(discussion_id, "initial_state", {
            "discussion_status": disc.status,
            "latest_messages": [m_to_dict(m) for m in msgs[-20:]],
            "consensus_points": [c_to_dict(c) for c in cps],
            "panelists": [p_to_dict(p) for p in panelists],
        })
        await manager.broadcast(discussion_id, "discussion_started", {
            "topic": disc.topic,
            "panelist_count": len(panelists),
        })

        round_num = 1
        consensus_interval = random.randint(3, 5)

        while not stop_event.is_set():
            # 重新加载上下文
            _, panelists, msgs, cps = await _build_context(discussion_id)

            panelist_json = _build_panelist_json(panelists)
            transcript = _build_transcript_text(msgs, panelists)
            consensus_text = _build_consensus_text(cps)

            try:
                turn = await discussion_turn(
                    disc.topic, panelist_json, transcript, consensus_text, round_num)
            except LLMError:
                await manager.broadcast(discussion_id, "error", {
                    "message": "LLM 调用失败，讨论已中断", "recoverable": False,
                })
                break

            speaker_id = turn.get("speaker_id", "")
            content = turn.get("content", "")
            msg_type = turn.get("message_type", "ANSWER").upper()
            statuses = turn.get("panelist_statuses", [])

            # 更新 Panelist 状态并推送
            async with AsyncSessionLocal() as db:
                for s in statuses:
                    pid = s.get("panelist_id", "")
                    st = s.get("status", "STANDBY")
                    focus = s.get("current_focus") or None
                    await db.execute(
                        Panelist.__table__.update().where(Panelist.id == pid).values(status=st, current_focus=focus)
                    )

                # 存 Message
                max_seq = (await db.execute(
                    select(func.max(Message.sequence)).where(Message.discussion_id == discussion_id)
                )).scalar() or 0
                seq = max_seq + 1

                msg = Message(
                    discussion_id=discussion_id, panelist_id=speaker_id,
                    content=content, message_type=msg_type, sequence=seq,
                )
                db.add(msg)
                await db.commit()
                await db.refresh(msg)

                # 重新加载含 panelist 的 message
                speaker = (await db.execute(select(Panelist).where(Panelist.id == speaker_id))).scalar_one()
                msg_data = {
                    "id": msg.id, "discussion_id": msg.discussion_id, "panelist_id": msg.panelist_id,
                    "panelist_name": speaker.name, "panelist_title": speaker.title, "panelist_color": speaker.color,
                    "content": msg.content, "message_type": msg.message_type, "sequence": msg.sequence,
                    "created_at": msg.created_at.isoformat(),
                }

            # 推送状态
            await manager.broadcast(discussion_id, "panelist_status", {
                "panelists": statuses,
            })
            # 推送消息
            await manager.broadcast(discussion_id, "new_message", {
                "message": msg_data,
            })

            # 每 3–5 次共识提炼
            if seq % consensus_interval == 0 and seq > 0:
                try:
                    _, _, all_msgs, all_cps = await _build_context(discussion_id)
                    recent = all_msgs[-5:]
                    recent_text = _build_transcript_text(recent, panelists)
                    existing = _build_consensus_text(all_cps)
                    points = await extract_consensus(disc.topic, recent_text, existing)

                    if points:
                        async with AsyncSessionLocal() as db:
                            for p in points:
                                cp = ConsensusPoint(
                                    discussion_id=discussion_id,
                                    point_type=p["type"].upper(),
                                    content=p["content"],
                                    message_range_start=recent[0].sequence if recent else None,
                                    message_range_end=recent[-1].sequence if recent else None,
                                )
                                db.add(cp)
                            await db.commit()

                        # 重新加载全部共识
                        _, _, _, all_cps = await _build_context(discussion_id)
                        await manager.broadcast(discussion_id, "consensus_update", {
                            "points": [c_to_dict(c) for c in all_cps],
                        })
                except LLMError:
                    pass  # 共识提炼失败不中断讨论

                consensus_interval = random.randint(3, 5)

            # 每 30 条发言：LLM 生成阶段总结，暂停等用户确认
            if seq % 30 == 0 and seq > 0:
                _, panelists, all_msgs, all_cps = await _build_context(discussion_id)
                transcript = _build_transcript_text(all_msgs, panelists)
                consensus_text = _build_consensus_text(all_cps)

                # 自动生成阶段性总结
                try:
                    stage_summary = await generate_summary(disc.topic, transcript, consensus_text)
                except Exception:
                    stage_summary = f"讨论已进行 {seq} 轮，各方观点交锋激烈。"

                await manager.broadcast(discussion_id, "host_prompt", {
                    "message": f"讨论已进行 {seq} 轮，以下是阶段性总结。",
                    "summary": stage_summary,
                    "total_messages": seq,
                })
                # 等待用户确认（60s），超时自动暂停
                if discussion_id not in _pause_events:
                    _pause_events[discussion_id] = asyncio.Event()
                else:
                    _pause_events[discussion_id].clear()

                try:
                    await asyncio.wait_for(_pause_events[discussion_id].wait(), timeout=60)
                except asyncio.TimeoutError:
                    await manager.broadcast(discussion_id, "discussion_paused", {
                        "message": "讨论已暂停，点击继续按钮恢复。",
                    })
                    await _pause_events[discussion_id].wait()

            round_num += 1
            await asyncio.sleep(1.5)

    except asyncio.CancelledError:
        pass
    finally:
        # 总结
        try:
            _, panelists, msgs, cps = await _build_context(discussion_id)
            transcript = _build_transcript_text(msgs, panelists)
            consensus_text = _build_consensus_text(cps)
            summary = await generate_summary(disc.topic, transcript, consensus_text)

            # 存 SUMMARY Message
            async with AsyncSessionLocal() as db:
                host = next((p for p in panelists if p.role == "HOST"), None)
                if host:
                    max_seq = (await db.execute(
                        select(func.max(Message.sequence)).where(Message.discussion_id == discussion_id)
                    )).scalar() or 0
                    msg = Message(
                        discussion_id=discussion_id, panelist_id=host.id,
                        content=summary, message_type="SUMMARY", sequence=max_seq + 1,
                    )
                    db.add(msg)
                    disc = (await db.execute(select(Discussion).where(Discussion.id == discussion_id))).scalar_one()
                    disc.status = "ENDED"
                    await db.commit()
        except Exception:
            summary = "讨论已结束。"

        await manager.broadcast(discussion_id, "discussion_ended", {
            "summary": summary,
            "total_messages": len(msgs) + 1,
        })


# ═══ 辅助序列化 ════════════════════════════════════

def m_to_dict(m: Message) -> dict:
    return {
        "id": m.id, "discussion_id": m.discussion_id, "panelist_id": m.panelist_id,
        "panelist_name": getattr(m, "panelist_name", ""),
        "panelist_title": getattr(m, "panelist_title", ""),
        "panelist_color": getattr(m, "panelist_color", ""),
        "content": m.content, "message_type": m.message_type, "sequence": m.sequence,
        "created_at": m.created_at.isoformat() if m.created_at else "",
    }


def c_to_dict(c: ConsensusPoint) -> dict:
    return {
        "id": c.id, "discussion_id": c.discussion_id, "point_type": c.point_type,
        "content": c.content, "message_range_start": c.message_range_start,
        "message_range_end": c.message_range_end,
        "generated_at": c.generated_at.isoformat() if c.generated_at else "",
    }


def p_to_dict(p: Panelist) -> dict:
    return {
        "id": p.id, "discussion_id": p.discussion_id, "name": p.name,
        "role": p.role, "profession": p.profession, "title": p.title,
        "stance": p.stance, "color": p.color, "status": p.status,
        "current_focus": p.current_focus, "sort_order": p.sort_order,
    }
