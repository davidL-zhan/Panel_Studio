"""SDD §02-api-contract — FastAPI 主应用 · 13 REST + 1 WebSocket"""
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from .database import Base, engine, AsyncSessionLocal, get_db, init_db, Discussion, Panelist, Message, ConsensusPoint
from .schemas import (
    DiscussionOut, DiscussionDetailOut, CreateDiscussionIn,
    PanelistOut, PanelGenerateOut, MessageOut, ConsensusPointOut,
    TranscriptOut, StartOut, EndOut,
)
from .llm import generate_panel, replace_expert, assign_colors, HOST_COLOR, LLMError, PANELIST_COLORS
from .ws_manager import manager
from .engine import run_discussion_engine, resume_discussion

# 讨论引擎运行中的任务
_engine_tasks: dict[str, asyncio.Task] = {}
_engine_stop_events: dict[str, asyncio.Event] = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    # 关闭时取消所有引擎任务
    for task in _engine_tasks.values():
        task.cancel()


app = FastAPI(title="AI Panel Studio", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"], allow_headers=["*"],
)


# ══════════════════════════════════════════════════════
# REST：讨论管理
# ══════════════════════════════════════════════════════

@app.get("/api/discussions", response_model=list[DiscussionOut])
async def list_discussions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Discussion).order_by(Discussion.created_at.desc())
    )
    return result.scalars().all()


@app.post("/api/discussions", response_model=DiscussionOut, status_code=201)
async def create_discussion(body: CreateDiscussionIn, db: AsyncSession = Depends(get_db)):
    disc = Discussion(topic=body.topic, expert_count=body.expert_count)
    db.add(disc)
    await db.commit()
    await db.refresh(disc)
    return disc


@app.get("/api/discussions/{discussion_id}", response_model=DiscussionDetailOut)
async def get_discussion(discussion_id: str, db: AsyncSession = Depends(get_db)):
    disc = await db.execute(
        select(Discussion).where(Discussion.id == discussion_id)
    )
    disc = disc.scalar_one_or_none()
    if not disc:
        raise HTTPException(404, "讨论不存在")

    panelists = (await db.execute(
        select(Panelist).where(Panelist.discussion_id == discussion_id).order_by(Panelist.sort_order)
    )).scalars().all()

    messages = (await db.execute(
        select(Message).where(Message.discussion_id == discussion_id).order_by(Message.sequence.desc()).limit(500)
    )).scalars().all()

    cps = (await db.execute(
        select(ConsensusPoint).where(ConsensusPoint.discussion_id == discussion_id)
    )).scalars().all()

    # 填充 Message 的 JOIN 衍生字段
    pmap = {p.id: p for p in panelists}
    msg_list = []
    for m in reversed(messages):
        p = pmap.get(m.panelist_id)
        msg_list.append({
            "id": m.id, "discussion_id": m.discussion_id, "panelist_id": m.panelist_id,
            "panelist_name": p.name if p else "", "panelist_title": p.title if p else "",
            "panelist_color": p.color if p else "", "content": m.content,
            "message_type": m.message_type, "sequence": m.sequence,
            "created_at": m.created_at,
        })

    return DiscussionDetailOut(
        id=disc.id, topic=disc.topic, expert_count=disc.expert_count,
        status=disc.status, created_at=disc.created_at, updated_at=disc.updated_at,
        panelists=[PanelistOut.model_validate(p) for p in panelists],
        latest_messages=[MessageOut.model_validate(m) for m in msg_list],
        consensus_points=[ConsensusPointOut.model_validate(c) for c in cps],
    )


@app.delete("/api/discussions/{discussion_id}", status_code=204)
async def delete_discussion(discussion_id: str, db: AsyncSession = Depends(get_db)):
    # 若 IN_PROGRESS，先停止引擎
    if discussion_id in _engine_stop_events:
        _engine_stop_events[discussion_id].set()
        task = _engine_tasks.pop(discussion_id, None)
        if task:
            task.cancel()
        _engine_stop_events.pop(discussion_id, None)

    disc = (await db.execute(select(Discussion).where(Discussion.id == discussion_id))).scalar_one_or_none()
    if not disc:
        raise HTTPException(404, "讨论不存在")
    await db.delete(disc)
    await db.commit()
    # 推送删除事件
    await manager.broadcast(discussion_id, "discussion_deleted", {"discussion_id": discussion_id})


# ══════════════════════════════════════════════════════
# REST：嘉宾管理
# ══════════════════════════════════════════════════════

@app.post("/api/discussions/{discussion_id}/panel/generate", response_model=PanelGenerateOut)
async def api_generate_panel(discussion_id: str, db: AsyncSession = Depends(get_db)):
    disc = (await db.execute(select(Discussion).where(Discussion.id == discussion_id))).scalar_one_or_none()
    if not disc:
        raise HTTPException(404, "讨论不存在")
    if disc.status != "PENDING_PANEL":
        raise HTTPException(409, "仅 PENDING_PANEL 状态可生成嘉宾")

    try:
        host_data, experts_data = await generate_panel(disc.topic, disc.expert_count)
    except LLMError as e:
        raise HTTPException(502, str(e))

    colors = assign_colors(disc.expert_count)

    host = Panelist(
        discussion_id=discussion_id, name=host_data["name"], role="HOST",
        profession=host_data["profession"], title=host_data["title"], stance=host_data["stance"],
        color=HOST_COLOR, sort_order=0,
    )
    db.add(host)

    expert_objs = []
    for i, expert_data in enumerate(experts_data):
        e = Panelist(
            discussion_id=discussion_id, name=expert_data["name"], role="EXPERT",
            profession=expert_data["profession"], title=expert_data["title"], stance=expert_data["stance"],
            color=colors[i], sort_order=i + 1,
        )
        db.add(e)
        expert_objs.append(e)

    disc.status = "PANEL_READY"
    await db.commit()
    await db.refresh(host)
    for e in expert_objs:
        await db.refresh(e)

    return PanelGenerateOut(
        host=PanelistOut.model_validate(host),
        experts=[PanelistOut.model_validate(e) for e in expert_objs],
    )


@app.get("/api/discussions/{discussion_id}/panel", response_model=PanelGenerateOut)
async def api_get_panel(discussion_id: str, db: AsyncSession = Depends(get_db)):
    panelists = (await db.execute(
        select(Panelist).where(Panelist.discussion_id == discussion_id).order_by(Panelist.sort_order)
    )).scalars().all()
    if not panelists:
        raise HTTPException(404, "嘉宾不存在")
    host = next((p for p in panelists if p.role == "HOST"), None)
    experts = [p for p in panelists if p.role == "EXPERT"]
    if not host:
        raise HTTPException(404, "主持人不存在")
    return PanelGenerateOut(
        host=PanelistOut.model_validate(host),
        experts=[PanelistOut.model_validate(e) for e in experts],
    )


@app.put("/api/discussions/{discussion_id}/panel/{panelist_id}", response_model=PanelistOut)
async def api_replace_expert(discussion_id: str, panelist_id: str, db: AsyncSession = Depends(get_db)):
    disc = (await db.execute(select(Discussion).where(Discussion.id == discussion_id))).scalar_one_or_none()
    if not disc:
        raise HTTPException(404, "讨论不存在")
    if disc.status != "PANEL_READY":
        raise HTTPException(409, "仅 PANEL_READY 状态可替换专家")

    panelist = (await db.execute(select(Panelist).where(Panelist.id == panelist_id))).scalar_one_or_none()
    if not panelist:
        raise HTTPException(404, "嘉宾不存在")
    if panelist.role == "HOST":
        raise HTTPException(400, "不能替换主持人")

    all_panelists = (await db.execute(
        select(Panelist).where(Panelist.discussion_id == discussion_id)
    )).scalars().all()

    existing_text = "\n".join(
        f"- {p.name}（{p.profession}，{p.stance}）" for p in all_panelists
    )

    try:
        new_data = await replace_expert(disc.topic, existing_text, f"{panelist.name}（{panelist.stance}）")
    except LLMError as e:
        raise HTTPException(502, str(e))

    panelist.name = new_data["name"]
    panelist.profession = new_data["profession"]
    panelist.title = new_data["title"]
    panelist.stance = new_data["stance"]
    await db.commit()
    await db.refresh(panelist)

    return PanelistOut.model_validate(panelist)


@app.post("/api/discussions/{discussion_id}/panel/regenerate", response_model=PanelGenerateOut)
async def api_regenerate_panel(discussion_id: str, db: AsyncSession = Depends(get_db)):
    disc = (await db.execute(select(Discussion).where(Discussion.id == discussion_id))).scalar_one_or_none()
    if not disc:
        raise HTTPException(404, "讨论不存在")
    if disc.status != "PANEL_READY":
        raise HTTPException(409, "仅 PANEL_READY 状态可重新生成")

    # 删除旧嘉宾
    old = (await db.execute(select(Panelist).where(Panelist.discussion_id == discussion_id))).scalars().all()
    for p in old:
        await db.delete(p)
    disc.status = "PENDING_PANEL"
    await db.commit()

    # 重新生成
    return await api_generate_panel(discussion_id, db)


# ══════════════════════════════════════════════════════
# REST：讨论控制
# ══════════════════════════════════════════════════════

@app.post("/api/discussions/{discussion_id}/start", response_model=StartOut)
async def api_start_discussion(discussion_id: str, db: AsyncSession = Depends(get_db)):
    # 原子性乐观锁
    result = await db.execute(
        update(Discussion)
        .where(Discussion.id == discussion_id, Discussion.status == "PANEL_READY")
        .values(status="IN_PROGRESS")
    )
    if result.rowcount == 0:
        disc = (await db.execute(select(Discussion).where(Discussion.id == discussion_id))).scalar_one_or_none()
        if not disc:
            raise HTTPException(404, "讨论不存在")
        raise HTTPException(409, f"仅 PANEL_READY 状态可开始，当前: {disc.status}")

    await db.commit()

    # 启动引擎
    stop_event = asyncio.Event()
    _engine_stop_events[discussion_id] = stop_event
    _engine_tasks[discussion_id] = asyncio.create_task(
        run_discussion_engine(discussion_id, stop_event)
    )

    return StartOut(status="IN_PROGRESS", message="讨论已开始，请通过 WebSocket 接收实时事件")


@app.post("/api/discussions/{discussion_id}/end", response_model=EndOut)
async def api_end_discussion(discussion_id: str, db: AsyncSession = Depends(get_db)):
    # 幂等：已 ENDED 返回已有总结
    disc = (await db.execute(select(Discussion).where(Discussion.id == discussion_id))).scalar_one_or_none()
    if not disc:
        raise HTTPException(404, "讨论不存在")
    if disc.status == "ENDED":
        # 找到 SUMMARY message
        summary_msg = (await db.execute(
            select(Message).where(
                Message.discussion_id == discussion_id,
                Message.message_type == "SUMMARY",
            ).order_by(Message.sequence.desc()).limit(1)
        )).scalar_one_or_none()
        return EndOut(status="ENDED", summary=summary_msg.content if summary_msg else "讨论已结束。")

    if disc.status != "IN_PROGRESS":
        raise HTTPException(409, f"仅 IN_PROGRESS 状态可结束，当前: {disc.status}")

    # 原子性乐观锁
    result = await db.execute(
        update(Discussion)
        .where(Discussion.id == discussion_id, Discussion.status == "IN_PROGRESS")
        .values(status="ENDED")
    )
    await db.commit()

    # 停止引擎
    stop = _engine_stop_events.pop(discussion_id, None)
    if stop:
        stop.set()
    task = _engine_tasks.pop(discussion_id, None)
    if task:
        try:
            await asyncio.wait_for(task, timeout=35)
        except asyncio.TimeoutError:
            task.cancel()

    # 取总结
    summary_msg = (await db.execute(
        select(Message).where(
            Message.discussion_id == discussion_id,
            Message.message_type == "SUMMARY",
        ).order_by(Message.sequence.desc()).limit(1)
    )).scalar_one_or_none()

    return EndOut(
        status="ENDED",
        summary=summary_msg.content if summary_msg else "讨论已结束。",
    )


@app.post("/api/discussions/{discussion_id}/continue")
async def api_continue_discussion(discussion_id: str):
    """恢复暂停的讨论（30 轮后提示）"""
    resume_discussion(discussion_id)
    return {"status": "ok", "message": "讨论继续"}


# ══════════════════════════════════════════════════════
# REST：数据查询
# ══════════════════════════════════════════════════════

@app.get("/api/discussions/{discussion_id}/transcript", response_model=TranscriptOut)
async def api_transcript(
    discussion_id: str,
    offset: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    total = (await db.execute(
        select(func.count(Message.id)).where(Message.discussion_id == discussion_id)
    )).scalar() or 0

    msgs = (await db.execute(
        select(Message)
        .where(Message.discussion_id == discussion_id)
        .order_by(Message.sequence)
        .offset(offset).limit(limit)
    )).scalars().all()

    panelists = (await db.execute(
        select(Panelist).where(Panelist.discussion_id == discussion_id)
    )).scalars().all()
    pmap = {p.id: p for p in panelists}

    msg_list = []
    for m in msgs:
        p = pmap.get(m.panelist_id)
        msg_list.append(MessageOut(
            id=m.id, discussion_id=m.discussion_id, panelist_id=m.panelist_id,
            panelist_name=p.name if p else "", panelist_title=p.title if p else "",
            panelist_color=p.color if p else "",
            content=m.content, message_type=m.message_type, sequence=m.sequence,
            created_at=m.created_at,
        ))

    return TranscriptOut(total=total, messages=msg_list)


@app.get("/api/discussions/{discussion_id}/consensus", response_model=list[ConsensusPointOut])
async def api_consensus(discussion_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ConsensusPoint).where(ConsensusPoint.discussion_id == discussion_id)
    )
    return [ConsensusPointOut.model_validate(c) for c in result.scalars().all()]


# ══════════════════════════════════════════════════════
# WebSocket
# ══════════════════════════════════════════════════════

@app.websocket("/ws/discussions/{discussion_id}")
async def ws_discussion(websocket: WebSocket, discussion_id: str):
    await manager.connect(discussion_id, websocket)

    # 发送 initial_state
    async with AsyncSessionLocal() as db:
        disc = (await db.execute(select(Discussion).where(Discussion.id == discussion_id))).scalar_one_or_none()
        if disc:
            panelists = (await db.execute(
                select(Panelist).where(Panelist.discussion_id == discussion_id)
            )).scalars().all()
            msgs = (await db.execute(
                select(Message).where(Message.discussion_id == discussion_id).order_by(Message.sequence.desc()).limit(500)
            )).scalars().all()
            cps = (await db.execute(
                select(ConsensusPoint).where(ConsensusPoint.discussion_id == discussion_id)
            )).scalars().all()

            from .engine import p_to_dict, m_to_dict, c_to_dict
            await manager.broadcast_initial_state(discussion_id, websocket, {
                "discussion_status": disc.status,
                "latest_messages": [m_to_dict(m) for m in reversed(list(msgs))],
                "consensus_points": [c_to_dict(c) for c in cps],
                "panelists": [p_to_dict(p) for p in panelists],
            })

    try:
        while True:
            data = await websocket.receive_text()
            # 处理客户端消息
            if '"ping"' in data:
                await websocket.send_text('{"type":"pong"}')
            elif '"continue"' in data:
                resume_discussion(discussion_id)
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(discussion_id, websocket)
