# 04 — LLM 交互协议

> SDD 阶段 · DeepSeek API Prompt 结构与输出 Schema · AI Panel Studio

---

## 1. 概述

本系统共有 **4 个 LLM 调用场景**，每个场景有独立的 Prompt 模板和结构化输出要求：

| 场景 | 调用时机 | 输出格式 | 流式 |
|------|----------|----------|------|
| A. 嘉宾阵容生成 | 用户创建讨论后 | JSON | 否 |
| B. 讨论回合推进 | 讨论进行中，每轮一次 | JSON | 否 |
| C. 共识/分歧提炼 | 每 3–5 次发言后 | JSON | 否 |
| D. 主持人总结 | 用户结束讨论后 | 纯文本 | 否 |
| E. 单个替代专家生成 | 用户替换某位专家时 | JSON | 否 |

---

## 2. 通用约定

### 2.1 API 调用方式

```
POST https://api.deepseek.com/v1/chat/completions
```

所有场景共用：
- `model`: `deepseek-chat`（或用户指定的 DeepSeek V4 Pro 模型 ID）
- `temperature`: 场景 A/E 用 `0.8`（多样性），B 用 `0.7`，C/D 用 `0.3`（准确性）
- `response_format`: 场景 A/B/C/E 使用 `{ "type": "json_object" }`，场景 D 不需要

### 2.2 输出校验

所有 LLM JSON 输出在写入数据库前必须经过校验层处理。校验规则详见 [`05-validation-layer.md`](./05-validation-layer.md)。核心原则：

- **永不信任 LLM 输出**：所有字段均需校验类型、范围和引用完整性
- 校验失败 → 重试 1 次（将校验错误信息注入重试 prompt）
- 重试仍失败 → 按 §2.3 错误处理策略降级

[→ M-08 修复]

### 2.3 错误处理

| 情况 | 处理策略 |
|------|----------|
| API 超时（> 30s） | 重试 1 次（指数退避 1s → 2s），仍失败则通过 WS 推送 `error`（recoverable） |
| 返回 JSON 解析失败 | 重试 1 次，仍失败则通过 WS 推送 `error`（不可恢复，停止讨论） |
| API 返回 429 Rate Limit | 等待 `Retry-After` 头或指数退避（1s → 2s → 4s），最多 3 次重试 |
| API 返回 503 Service Unavailable | 等待 2s 后重试 1 次，仍失败则推送 `error`（recoverable） |
| API 返回 4xx（非 429） | 不重试，通过 WS 推送 `error`（不可恢复，停止讨论） |
| API 返回 5xx（非 503） | 重试 1 次，仍失败则推送 `error`（不可恢复，停止讨论） |
| `finish_reason != "stop"` | 视为截断，通过 WS 推送 `error`（可恢复，重试 1 次） |

[→ S-03 修复：增加 429/503 及指数退避]

---

## 3. 场景 A：嘉宾阵容生成

### 3.1 触发
`POST /api/discussions/{id}/panel/generate`

### 3.2 System Prompt

```text
你是一位资深的圆桌讨论策划人。你的任务是根据给定的话题，生成一位主持人和 N 位专家嘉宾的完整阵容。

要求：
1. 主持人：
   - 立场中立、善于提问和总结
   - 职业应为"圆桌主持人"或相关媒体/访谈领域
   
2. 专家嘉宾：
   - 每位专家拥有不同的职业背景、专业领域和立场
   - 立场需要形成多元碰撞（有的激进有的保守，有的理想主义有的务实）
   - 确保至少 2 组对立的立场维度
   - 姓名使用中文，体现多样性
   - 职业和头衔要具体且有说服力
   
3. 输出格式：严格的 JSON，结构如下：
{
  "host": {
    "name": "姓名",
    "profession": "职业",
    "title": "头衔",
    "stance": "立场"
  },
  "experts": [
    {
      "name": "姓名",
      "profession": "职业",
      "title": "头衔",
      "stance": "立场"
    }
  ]
}
```

### 3.3 User Message

```text
话题：{topic}
专家人数：{expert_count}

请生成嘉宾阵容。
```

### 3.4 输出处理

后端收到 JSON 后：
1. 校验 `experts` 数组长度 = `expert_count`
2. 校验所有必填字段存在且非空
3. 为主持人和每位专家生成 UUID
4. 从前端预设色板按序分配 `color`（`["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F"]`）
5. `sort_order`：主持人 = 0，专家按数组索引 + 1
6. 写入数据库，返回给前端

### 3.5 预设色板

```python
PANELIST_COLORS = [
    "#FF6B6B",  # 珊瑚红
    "#4ECDC4",  # 青绿（主持人专用）
    "#45B7D1",  # 天蓝
    "#96CEB4",  # 薄荷绿
    "#FFEAA7",  # 暖黄
    "#DDA0DD",  # 梅紫
    "#98D8C8",  # 浅绿松石
    "#F7DC6F",  # 金盏黄
    "#E17055",  # 陶土橙
    "#6C5CE7",  # 薰衣草紫
]
# 主持人固定使用 #4ECDC4（青绿），专家按序从剩余颜色中分配
# 10 色色板 = 1 主持 + 最多 8 专家 + 1 冗余 [→ B-01 修复]
```

### 3.6 色板分配算法

```python
HOST_COLOR = "#4ECDC4"

def assign_colors(host: Panelist, experts: list[Panelist]) -> None:
    """前端/后端分配颜色后写入 DB"""
    host.color = HOST_COLOR
    # 从色板中排除主持人色，构建专家可用颜色池
    expert_colors = [c for c in PANELIST_COLORS if c != HOST_COLOR]
    for i, expert in enumerate(experts):
        expert.color = expert_colors[i % len(expert_colors)]
```

> 注：`expert_colors` 池当前为 9 色，足以覆盖最大 8 位专家。`i % len(expert_colors)` 为极端情况（未来扩展）提供兜底。 [→ m-11 修复]

---

## 4. 场景 B：讨论回合推进

### 4.1 触发
讨论引擎后台循环，每轮调用一次。

### 4.2 System Prompt

```text
你正在主持一场 AI 圆桌讨论。场上有 1 位主持人（你）和 {expert_count} 位专家嘉宾。

你的核心职责：
1. **主持人（你）负责调动发言**：开场、向专家提问、追问、在不同观点间串联、在你认为讨论充分时进行总结收尾。
2. **专家自主表达**：专家可以抢答、补充他人观点、反驳不同立场，但必须由主持人点名后才能发言。
3. **发言规则**：
   - 每次发言控制在 1-2 句，精炼有力
   - 禁止机械式轮流发言——发言顺序由讨论内容驱动
   - 主持人不能连续发言超过 2 次
   - 同一专家不能连续发言超过 1 次（除非主持人点名追问）
   
4. **开场**：如果这是第 1 轮，主持人进行开场白，介绍话题和嘉宾阵容。

5. **输出格式**：严格的 JSON，只输出一个回合的发言和状态更新：
{
  "speaker_id": "发言人的 panelist UUID",
  "content": "发言内容，1-2 句",
  "message_type": "OPENING|QUESTION|ANSWER|SUPPLEMENT|REBUTTAL|TRANSITION",
  "panelist_statuses": [
    {
      "panelist_id": "嘉宾 UUID",
      "status": "STANDBY|PREPARING|SPEAKING",
      "current_focus": "该嘉宾当前关注点或公开思考摘要，STANDBY 时可省略"
    }
  ]
}

注意：
- speaker_id 必须从提供的嘉宾列表中选择一个 UUID
- panelist_statuses 必须覆盖所有嘉宾（含主持人和发言人自身）
- 发言人 status 为 SPEAKING
- 被点名但尚未发言的专家 status 为 PREPARING
- current_focus 是公开的思考方向（如"准备反驳碳排放观点"），不是隐藏的 chain-of-thought
- 绝对不要输出任何 JSON 以外的文本
```

### 4.3 User Message（每轮动态构建）

```text
## 当前讨论

话题：{topic}

## 嘉宾阵容

{panelists_json}
<!-- 格式：
[
  {"id": "uuid", "name": "...", "role": "HOST|EXPERT", "profession": "...", "title": "...", "stance": "..."}
]
-->

## 讨论 Transcript（按发言顺序）

{transcript_text}
<!-- 格式：
[1] 张明远（主持人·科技媒体主编）：各位好，今天我们来探讨...
[2] 李思涵（前 OpenAI 科学家）：我认为 AI 不是在取代创造力...
...
-->

## 当前共识与分歧

{consensus_text}
<!-- 格式：
✅ 共识：
- ...
⚠️ 分歧：
- ...
若无则为"尚无"
-->

## 当前回合

这是第 {round_number} 轮发言。请决定下一轮谁来发言以及说什么。
```

### 4.4 Transcript 文本构建规则

```python
def build_transcript_text(messages: list[Message], panelists: dict[str, Panelist]) -> str:
    lines = []
    for msg in messages:
        p = panelists[msg.panelist_id]
        role_tag = "主持人" if p.role == "HOST" else p.title
        lines.append(f"[{msg.sequence}] {p.name}（{role_tag}）：{msg.content}")
    return "\n".join(lines)
```

### 4.5 讨论引擎伪代码

```python
async def discussion_engine(discussion_id: str, ws_manager: WebSocketManager):
    """后台讨论引擎，在 asyncio task 中运行"""
    disc = await get_discussion(discussion_id)
    panelists = await get_panelists(discussion_id)
    panelist_map = {p.id: p for p in panelists}
    messages = []

    round_num = 1
    stop_signal = asyncio.Event()

    # 推送讨论开始事件 [→ m-02 修复]
    await ws_manager.broadcast(discussion_id, "discussion_started", {
        "topic": disc.topic,
        "panelist_count": len(panelists),
    })

    try:
        while not stop_signal.is_set():
            # 构建 prompt
            prompt = build_turn_prompt(disc, panelists, messages, round_num)

            # 调用 DeepSeek
            response = await call_deepseek(prompt, temperature=0.7)

            # 解析 + 校验 JSON（见 05-validation-layer.md）
            turn = parse_and_validate_turn(response, panelist_map)

            # 更新 Panelist 状态（先推状态再推消息）[→ m-07 修复]
            await update_panelist_statuses(turn.panelist_statuses)
            await ws_manager.broadcast(discussion_id, "panelist_status", {
                "panelists": turn.panelist_statuses
            })

            # 存入 Message
            message = await save_message(discussion_id, turn)

            # 推消息
            await ws_manager.broadcast(discussion_id, "new_message", message)

            messages.append(message)
            round_num += 1

            # 更新 Discussion.updated_at 检查点 [→ M-06 修复]
            await touch_discussion(discussion_id)

            # 每 3-5 次发言触发共识提炼 [→ m-04 修复]
            if message.sequence % consensus_interval == 0:
                await extract_consensus(discussion_id, messages[-5:], ws_manager)
                consensus_interval = random.randint(3, 5)  # 设定下一次目标间隔

            # 短暂延迟，营造实时感
            await asyncio.sleep(1.5)
    finally:
        # 停止信号后的总结生成 [→ M-02 修复]
        if stop_signal.is_set():
            summary = await generate_host_summary(discussion_id, messages)
            # 总结写入 Transcript（SUMMARY 类型 Message）
            summary_msg = await save_summary_message(discussion_id, panelist_map, summary)
            # 推送总结事件
            await ws_manager.broadcast(discussion_id, "discussion_ended", {
                "summary": summary,
                "total_messages": len(messages) + 1,
            })
        await mark_discussion_ended(discussion_id)
```

---

## 5. 场景 C：共识/分歧提炼

### 5.1 触发
讨论引擎每 3–5 次发言后自动触发（与场景 B 交替执行）。

### 5.2 System Prompt

```text
你是一位中立的会议记录分析师。你的任务是从最近的圆桌讨论发言中提炼共识与分歧。

规则：
1. 共识（CONSENSUS）：至少 2 位嘉宾明确表达一致或高度相似的观点
2. 分歧（DISAGREEMENT）：至少 2 位嘉宾表达了相互矛盾或对立的核心观点
3. 每条共识/分歧用一句简洁的话概括，不超过 50 字
4. 如果没有明显共识或分歧，返回空数组 []
5. 所有提炼必须基于具体发言内容，不得臆造

输出格式：严格的 JSON
{
  "points": [
    {
      "type": "CONSENSUS|DISAGREEMENT",
      "content": "概括内容"
    }
  ]
}
```

### 5.3 User Message

```text
话题：{topic}

## 最近 5 条发言

{recent_transcript}

## 已有共识/分歧（避免重复）

{existing_consensus_text}

请提炼新的共识或分歧。
```

### 5.4 输出处理

- 对 `points` 中的每一条，与已有 ConsensusPoint 做语义去重：
  - 使用 **Jaccard 相似度**（基于分词后的关键词集合）：`J(A, B) = |A ∩ B| / |A ∪ B|`
  - 阈值：`J ≥ 0.6` 视为重复，跳过不写入 [→ S-04 修复]
- 新条目写入数据库，设置 `message_range_start` 和 `message_range_end`
- 通过 WS 推送 `consensus_update`（全量替换，包含历史 + 新增）

---

## 6. 场景 D：主持人总结

### 6.1 触发
用户点击"结束讨论"后。

### 6.2 System Prompt

```text
你是一位专业的圆桌讨论主持人。请对刚才的讨论做自然语言总结。

要求：
1. 回顾讨论的核心议题和主要观点碰撞
2. 总结达成的共识和依然存在的分歧
3. 对讨论的深度和广度做出评价
4. 语气亲和、专业，如同电视节目主持人的结束语
5. 控制在 150-300 字
6. 纯文本输出，不要 JSON，不要 markdown
```

### 6.3 User Message

```text
话题：{topic}

## 完整 Transcript

{full_transcript}

## 共识与分歧

{all_consensus_points}

请做总结。
```

### 6.4 输出处理

- 将总结纯文本作为一条 `message_type=SUMMARY` 的 Message 写入数据库（`speaker=HOST`，`sequence` 接续当前最大序号）[→ M-01 修复]
- 返回纯文本给 REST 端点 `POST /api/discussions/{id}/end`
- 同时通过 WS 推送 `discussion_ended` 事件（含总结文本）
- 讨论状态置为 `ENDED`

---

## 7. 场景 E：单个替代专家生成

### 7.1 触发
`PUT /api/discussions/{id}/panel/{panelist_id}`

### 7.2 System Prompt

与场景 A 类似，但要求生成一个与已有阵容立场不同的专家。

```text
你是一位资深的圆桌讨论策划人。有一位专家需要被替换，请生成一个新的替代专家。

要求：
1. 新专家的职业、立场不能与已有嘉宾重复
2. 立场应与至少一位已有专家形成对立或互补
3. 姓名使用中文
4. 职业和头衔要具体且有说服力

输出格式：严格的 JSON
{
  "name": "姓名",
  "profession": "职业",
  "title": "头衔",
  "stance": "立场"
}
```

### 7.3 User Message [→ m-06 修复]

```text
话题：{topic}

## 已有嘉宾阵容

{existing_panelists_text}
<!-- 格式：
- 主持人：{name}（{profession}，{stance}）
- 专家 1：{name}（{profession}，{stance}）
...
-->

## 被替换专家

{replaced_panelist_name} — {replaced_panelist_profession}，立场：{replaced_panelist_stance}

请生成一位立场不同的替代专家。
```

---

## 8. Token 估算与费用控制

| 场景 | 单次 Input（估算） | 单次 Output（估算） | 每场讨论调用次数 |
|------|-------------------|--------------------|--------------------|
| A. 嘉宾生成 | ~500 tokens | ~300 tokens | 1 |
| B. 讨论回合 | ~2,000−4,000 tokens（随 transcript 增长） | ~200 tokens | 10–20 |
| C. 共识提炼 | ~800 tokens | ~150 tokens | 2–4 |
| D. 总结 | ~3,000−6,000 tokens | ~300 tokens | 1 |
| E. 专家替代 | ~400 tokens | ~150 tokens | 0–N |

> 一场 15 轮的讨论预计消耗 ~50,000−80,000 input tokens + ~3,500 output tokens。
> 按 DeepSeek V4 Pro 当前定价，单场讨论成本约 ¥0.05–0.10 人民币。10 元充值足以支撑完整的开发与测试周期。
