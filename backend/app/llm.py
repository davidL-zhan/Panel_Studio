"""SDD §04-llm-protocol — DeepSeek API 5 场景 + §05-validation-layer 校验"""
import json, re, logging
from httpx import AsyncClient, HTTPStatusError, TimeoutException
from .config import settings
from .database import Panelist

logger = logging.getLogger(__name__)

PANELIST_COLORS = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
    "#DDA0DD", "#98D8C8", "#F7DC6F", "#E17055", "#6C5CE7",
]
HOST_COLOR = PANELIST_COLORS[1]


class LLMError(Exception):
    pass


# ═══ DeepSeek 调用 ═══════════════════════════════════

async def _call_deepseek(system: str, user: str, temperature: float = 0.7, json_mode: bool = True) -> dict:
    body = {
        "model": settings.deepseek_model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": temperature,
        "max_tokens": 1024,
    }
    if json_mode:
        body["response_format"] = {"type": "json_object"}

    async with AsyncClient(timeout=30, trust_env=False) as client:
        try:
            resp = await client.post(
                f"{settings.deepseek_base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.deepseek_api_key}",
                    "Content-Type": "application/json",
                },
                json=body,
            )
            resp.raise_for_status()
            data = resp.json()
            content = data["choices"][0]["message"]["content"]

            if json_mode:
                # 清洗 markdown code fence
                content = re.sub(r"^```(?:json)?\s*", "", content.strip())
                content = re.sub(r"\s*```$", "", content)
                return json.loads(content)
            return {"text": content}

        except TimeoutException:
            raise LLMError("DeepSeek API timeout (30s)")
        except HTTPStatusError as e:
            try:
                detail = e.response.json()
            except Exception:
                detail = e.response.text
            logger.error(f"DeepSeek API {e.response.status_code}: {detail}")
            if e.response.status_code == 429:
                raise LLMError("Service busy, please retry later")
            raise LLMError(f"LLM service error ({e.response.status_code})")


# ═══ 场景 A：嘉宾阵容生成 (§4-llm-protocol §3) ═════

SCENE_A_SYSTEM = """你是一位资深的圆桌讨论策划人。根据给定的话题，生成一位主持人和 N 位专家嘉宾。

要求：
1. 主持人：立场中立、善于提问和总结
2. 专家：不同职业背景和立场，形成多元碰撞（至少 2 组对立立场）
3. 姓名使用中文，职业和头衔具体且有说服力

输出严格的 JSON：
{"host": {"name":"","profession":"","title":"","stance":""}, "experts":[{"name":"","profession":"","title":"","stance":""}]}"""


async def generate_panel(topic: str, expert_count: int) -> tuple[dict, list[dict]]:
    user = f"话题：{topic}\n专家人数：{expert_count}\n\n请生成嘉宾阵容。"
    data = await _call_deepseek(SCENE_A_SYSTEM, user, temperature=0.8)

    host = data.get("host", {})
    experts = data.get("experts", [])

    for f in ["name", "profession", "title", "stance"]:
        if not host.get(f):
            raise LLMError(f"嘉宾生成失败: host 缺少字段 {f}")

    if len(experts) != expert_count:
        # 重试一次
        data = await _call_deepseek(SCENE_A_SYSTEM, user + f"\n⚠️ 上一次输出 experts 数量={len(experts)}，期望={expert_count}。请确保恰好 {expert_count} 位。", temperature=0.8)
        experts = data.get("experts", [])

    if len(experts) != expert_count:
        raise LLMError(f"嘉宾生成失败: experts 数量={len(experts)}，期望={expert_count}")

    for i, e in enumerate(experts):
        for f in ["name", "profession", "title", "stance"]:
            if not e.get(f):
                raise LLMError(f"嘉宾生成失败: experts[{i}] 缺少字段 {f}")

    return host, experts


# ═══ 场景 B：讨论回合推进 (§4-llm-protocol §4) ════

SCENE_B_SYSTEM = """你正在主持一场 AI 圆桌讨论。场上有 1 位主持人和 {expert_count} 位专家。

你的核心职责：
1. 主持人负责调动发言：开场、提问、追问、串联
2. 专家自主表达：抢答、补充、反驳，但须主持人点名后才能发言
3. 发言控制在 1-2 句，精炼有力
4. 禁止机械式轮流发言——发言顺序由讨论内容驱动
5. 主持人不能连续发言超过 2 次，同一专家不能连续发言超过 1 次
6. 第 1 轮：主持人开场白，介绍话题和嘉宾阵容

输出严格的 JSON：
{"speaker_id":"","content":"","message_type":"OPENING|QUESTION|ANSWER|SUPPLEMENT|REBUTTAL|TRANSITION","panelist_statuses":[{"panelist_id":"","status":"STANDBY|PREPARING|SPEAKING","current_focus":""}]}

注意：
- speaker_id 必须从提供的嘉宾列表中选择 UUID
- panelist_statuses 必须覆盖所有嘉宾
- 发言人 status 为 SPEAKING，被点名未发言者为 PREPARING
- current_focus 是公开思考方向（如"准备反驳碳排放观点"），非隐藏 CoT
- 绝对不要输出 JSON 以外的文本"""


async def discussion_turn(topic: str, panelists_json: str, transcript_text: str, consensus_text: str, round_num: int) -> dict:
    system = SCENE_B_SYSTEM.replace("{expert_count}", str(len(json.loads(panelists_json)) - 1))
    user = f"""## 当前讨论
话题：{topic}

## 嘉宾阵容
{panelists_json}

## 讨论 Transcript
{transcript_text or "(尚无发言)"}

## 当前共识与分歧
{consensus_text or "尚无"}

## 当前回合
这是第 {round_num} 轮发言。请决定下一轮谁来发言以及说什么。"""

    data = await _call_deepseek(system, user, temperature=0.7)

    # 校验 speaker_id
    panelist_ids = {p["id"] for p in json.loads(panelists_json)}
    sid = data.get("speaker_id")
    if not sid or sid not in panelist_ids:
        data = await _call_deepseek(system, user + f"\n⚠️ speaker_id={sid} 不在嘉宾列表 {panelist_ids} 中，请修正。", temperature=0.7)
        sid = data.get("speaker_id")
        if not sid or sid not in panelist_ids:
            raise LLMError(f"讨论回合失败: speaker_id={sid} 不在嘉宾列表中（幻觉 UUID）")

    # 校验 message_type
    valid_types = {"OPENING", "QUESTION", "ANSWER", "SUPPLEMENT", "REBUTTAL", "TRANSITION"}
    mt = data.get("message_type", "").upper()
    if mt not in valid_types:
        raise LLMError(f"讨论回合失败: message_type={mt} 无效")

    return data


# ═══ 场景 C：共识/分歧提炼 (§4-llm-protocol §5) ═══

SCENE_C_SYSTEM = """你是一位中立的会议记录分析师。从最近发言中提炼共识与分歧。

规则：
1. 共识：至少 2 位嘉宾明确表达一致观点
2. 分歧：至少 2 位嘉宾表达了矛盾或对立观点
3. 每条概括不超过 50 字
4. 无共识/分歧返回空数组 []

输出严格的 JSON：
{"points":[{"type":"CONSENSUS|DISAGREEMENT","content":""}]}"""


async def extract_consensus(topic: str, recent_transcript: str, existing_text: str) -> list[dict]:
    user = f"""话题：{topic}

## 最近发言
{recent_transcript}

## 已有共识/分歧
{existing_text or "尚无"}

请提炼新的共识或分歧。"""

    data = await _call_deepseek(SCENE_C_SYSTEM, user, temperature=0.3)
    points = data.get("points", [])
    return [p for p in points if p.get("type") in ("CONSENSUS", "DISAGREEMENT") and p.get("content")]


# ═══ 场景 D：主持人总结 (§4-llm-protocol §6) ═════

SCENE_D_SYSTEM = """你是一位专业的圆桌讨论主持人。请对刚才的讨论做自然语言总结。

要求：
1. 回顾核心议题和主要观点碰撞
2. 总结达成的共识和依然存在的分歧
3. 语气亲和、专业，如同电视节目主持人的结束语
4. 控制在 150-300 字
5. 纯文本，不要 JSON，不要 markdown"""


async def generate_summary(topic: str, full_transcript: str, consensus_text: str) -> str:
    user = f"""话题：{topic}

## 完整 Transcript
{full_transcript}

## 共识与分歧
{consensus_text}

请做总结。"""

    data = await _call_deepseek(SCENE_D_SYSTEM, user, temperature=0.3, json_mode=False)
    return data.get("text", "")


# ═══ 场景 E：单个替代专家 (§4-llm-protocol §7) ═══

SCENE_E_SYSTEM = """你是一位资深的圆桌讨论策划人。有一位专家需要被替换，请生成新的替代专家。

要求：
1. 职业、立场不能与已有嘉宾重复
2. 立场应与至少一位已有专家形成对立或互补
3. 姓名使用中文，职业和头衔具体

输出严格的 JSON：
{"name":"","profession":"","title":"","stance":""}"""


async def replace_expert(topic: str, existing_text: str, replaced_name: str) -> dict:
    user = f"""话题：{topic}

## 已有嘉宾阵容
{existing_text}

## 被替换专家
{replaced_name}

请生成一位立场不同的替代专家。"""

    data = await _call_deepseek(SCENE_E_SYSTEM, user, temperature=0.8)
    for f in ["name", "profession", "title", "stance"]:
        if not data.get(f):
            raise LLMError(f"替代专家生成失败: 缺少字段 {f}")
    return data


# ═══ 色板分配 ═════════════════════════════════════

def assign_colors(experts_count: int) -> list[str]:
    pool = [c for c in PANELIST_COLORS if c != HOST_COLOR]
    return [pool[i % len(pool)] for i in range(experts_count)]
