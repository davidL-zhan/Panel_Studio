# SDD 交叉一致性审查报告

> 审查范围：`docs/sdd/01-domain-model.md` · `02-api-contract.md` · `03-database-schema.md` · `04-llm-protocol.md`
>
> 审查日期：2026-08-05

---

## 执行摘要

审查 4 份 SDD 文档共计发现 **28 项问题**：

| 严重度 | 数量 | 说明 |
|--------|------|------|
| 🔴 Blocker | 1 | 阻断实施：色板容量不足以覆盖最大专家数 |
| 🟠 Major | 10 | 设计缺陷：状态机缺口、并发/幂等/重连缺失、LLM 输出无校验层 |
| 🟡 Minor | 11 | 规格不一致或描述缺失：Prompt 字段遗漏、事件缺位、规则不可测 |
| 🟢 Suggestion | 6 | 改进建议：幂等 key、事件序列号、错误码补充 |

---

## 🔴 Blocker（1 项）

### B-01 · 色板容量不足以覆盖最大专家数

| 维度 | 详情 |
|------|------|
| **位置** | `04-llm-protocol.md` §3.5 预设色板；`01-domain-model.md` §1.1 expert_count ≤8 |
| **描述** | 预设色板共 8 种颜色。主持人固定占用 `#4ECDC4`，剩余 7 色分配给专家。当 `expert_count=8` 时，需为 8 位专家分配 8 色，实际可用仅 7 色，**缺少 1 色**。 |
| **影响** | `expert_count=8` 场景无法正常运行——必有一位专家无颜色标识，违反 FR-03"每位嘉宾有专属颜色标识"。 |
| **修复建议** | 将色板扩展至 ≥10 色（1 主持 + 最多 8 专家 + 1 冗余）。或降低 `expert_count` 上限至 7，同步更新 `01-domain-model.md` 和 `03-database-schema.md` 中的 CHECK 约束。 |

---

## 🟠 Major（10 项）

### M-01 · `MessageType.SUMMARY` 无任何场景创建——死枚举值

| 维度 | 详情 |
|------|------|
| **位置** | `01-domain-model.md` §1.3 MessageType 枚举；`04-llm-protocol.md` §1 场景总览 |
| **描述** | 领域模型定义了 `MessageType.SUMMARY`，DDL 和 SQLAlchemy 模型均包含该校验值。但场景 B 输出 schema 仅含 `OPENING\|QUESTION\|ANSWER\|SUPPLEMENT\|REBUTTAL\|TRANSITION`（无 SUMMARY），场景 D 主持人总结输出为**纯文本**，不创建 Message 记录。 |
| **影响** | SUMMARY 枚举值永远不会被写入数据库（死值）。主持人总结文本出现在 REST 响应和 WS 事件中，但不进入 Transcript——**总结在 Transcript 中缺失**，违反 FR-10"显示发言人姓名与职业/Title"的全覆盖预期。 |
| **修复建议** | 二选一：**(a)** 场景 D 结束后额外创建一条 `message_type=SUMMARY` 的 Message（speaker=HOST）；**(b)** 从所有文档中移除 SUMMARY 枚举值，并标注总结不纳入 Transcript（需用户确认）。 |

### M-02 · `POST /end` 流程与讨论引擎伪代码矛盾——总结生成路径缺失

| 维度 | 详情 |
|------|------|
| **位置** | `02-api-contract.md` §2.3（/end 流程）；`04-llm-protocol.md` §4.5（引擎伪代码） |
| **描述** | API 契约要求 `/end` 流程为：发送停止信号 → **引擎触发主持人总结** → 置 ENDED → 返回总结。但引擎伪代码仅展示 `while not stop_signal.is_set()` 循环，循环结束后**无任何总结生成逻辑**。实际上停止信号一旦置位，循环直接退出，无后续步骤。 |
| **影响** | 按伪代码实现会导致 `/end` 无法生成总结——REST 响应中 `summary` 为空，WS `discussion_ended` 事件无内容。 |
| **修复建议** | 引擎伪代码需补充 `finally` 或 `stop_signal` 后的总结生成路径：`if stop_signal.is_set(): summary = await generate_summary(...); broadcast("discussion_ended", summary)`。同时 API `/end` 端点应等待引擎完成总结后再返回（加入超时保护）。 |

### M-03 · `POST /start` 和 `/end` 存在竞态条件——无原子状态转换

| 维度 | 详情 |
|------|------|
| **位置** | `02-api-contract.md` §2.3（/start、/end 状态约束） |
| **描述** | /start 仅在 `PANEL_READY` 可用，/end 仅在 `IN_PROGRESS` 可用。但两处均为"先检查后执行"（check-then-act），未定义原子性保障。并发场景下：两个请求同时检查到 `PANEL_READY`，都通过校验，导致重复启动多个引擎任务。同理 `/end` 可能被重复调用。 |
| **影响** | 重复 `/start` → 创建多个后台引擎任务竞争写入；重复 `/end` → 多次调用 LLM 总结，浪费 token 并可能产生不一致结果。 |
| **修复建议** | 使用 SQLAlchemy 的 `UPDATE ... WHERE status = :expected` 原子条件更新（乐观锁），或 SQLite 事务 + `SELECT ... FOR UPDATE` 模拟。成功后返回新状态，失败则返回 409。 |

### M-04 · `PUT /panel/{pid}` 请求体与 LLM 调用责任矛盾——非幂等

| 维度 | 详情 |
|------|------|
| **位置** | `02-api-contract.md` §2.2 PUT /panel/{pid} |
| **描述** | 请求体要求传入 `{name, profession, title, stance}`（客户端提供数据），但注释又声明"替换专家的数据来自一次新的 LLM 调用"。矛盾在于：**(a)** 若由后端调用 LLM 生成替代专家，请求体应为空或仅含可选 hint；**(b)** 若由客户端提供完整数据，则无需后端 LLM 调用。当前规格无法判断真实的调用链路。此外，每次 PUT 均触发 LLM 调用（场景 E），两次相同请求返回不同结果——非幂等。 |
| **影响** | 前端不知道该传什么。重复 PUT 消耗 token 且结果不一致。 |
| **修复建议** | **方案 A（推荐）**：请求体改为空——`PUT /panel/{pid}` 无 body，后端自动调用场景 E 生成替代专家并返回。**方案 B**：保留 body 但所有字段改为 optional，作为客户端提示。无论哪种方案，需标注"重复调用将生成不同专家（非幂等）"。 |

### M-05 · WebSocket 重连/追赶策略完全缺失

| 维度 | 详情 |
|------|------|
| **位置** | `02-api-contract.md` §3 WebSocket 协议 |
| **描述** | 规格仅定义了连接建立后的事件推送，未覆盖以下场景：**(a)** 客户端断开后重连——是否会收到断开期间错过的消息？如何追赶到当前状态？**(b)** 重连后是否会收到重复事件？事件无 ID/序列号，客户端无法去重。**(c)** 连接到已 ENDED 的讨论——应返回完整历史还是仅返回 summary？**(d)** 连接到 PENDING_PANEL/PANEL_READY 状态的讨论——连接是否被接受？等待 start 期间推送什么？ |
| **影响** | 断线重连后 Transcript 出现空洞；已结束的讨论无法在 WS 上回看；非 IN_PROGRESS 状态的 WS 连接行为未定义——前端无法做连接就绪判断。 |
| **修复建议** | 补充 WS 连接规范：①连接成功后立即推送 `initial_state` 事件（含当前讨论状态、已有 transcript 摘要、共识列表）；②每条 WS 事件增加 `sequence_id`（单调递增）；③客户端重连时发送 `last_sequence_id`，服务端从此处开始重放；④非 IN_PROGRESS 状态接受连接但不推送业务事件（仅心跳）。 |

### M-06 · 无崩溃恢复——僵尸讨论与引擎泄漏

| 维度 | 详情 |
|------|------|
| **位置** | `02-api-contract.md` §2.3（/start 后台引擎）；`04-llm-protocol.md` §4.5（引擎伪代码） |
| **描述** | 后台讨论引擎为 asyncio Task，未定义任何持久化检查点或崩溃恢复。服务重启后：**(a)** 所有 IN_PROGRESS 讨论的引擎 Task 丢失，但数据库状态仍为 IN_PROGRESS（僵尸状态）；**(b)** 前端 WS 重连后无事件推送，UI 卡住；**(c)** 无 `/end` 以外的状态恢复或清理机制；**(d)** 删除 IN_PROGRESS 讨论时未提及取消对应的引擎 Task。 |
| **影响** | 服务重启后所有进行中的讨论变为不可恢复的僵尸；删除 IN_PROGRESS 讨论后引擎 Task 继续运行（内存泄漏 + 无意义 LLM 调用）。 |
| **修复建议** | ①服务启动时扫描 IN_PROGRESS 讨论，自动标记为 ENDED（附因"服务中断"）；②DELETE 端点规范补充"若讨论 IN_PROGRESS，先取消后台引擎 Task 再删除数据"；③讨论引擎增加检查点（每轮发言后更新 `updated_at`）以便未来支持断点续跑（MVP 可先不做）。 |

### M-07 · SQLite 并发写入未设计——多讨论并行性能风险

| 维度 | 详情 |
|------|------|
| **位置** | `03-database-schema.md`（全文未提及 WAL 或并发策略） |
| **描述** | SQLite 默认 journal_mode=DELETE，写操作串行执行。多场讨论并行运行时，每轮发言都触发 Message + Panelist + ConsensusPoint 写入，可能出现 `database is locked` 错误。规格未指定 WAL 模式、连接池大小或写入重试策略。 |
| **影响** | ≥3 场讨论同时进行时，写入冲突概率显著上升，可能导致发言丢失或 WS 推送延迟。 |
| **修复建议** | 在 `03-database-schema.md` 中补充：①启用 WAL 模式（`PRAGMA journal_mode=WAL`）；②设置 busy_timeout（≥5000ms）；③后端使用单一数据库连接 + 后台线程写入队列（SQLite 最佳实践），或使用 aiosqlite 异步驱动。 |

### M-08 · LLM 输出无校验层——非确定性输出可导致数据污染

| 维度 | 详情 |
|------|------|
| **位置** | `04-llm-protocol.md` 全篇（仅定义了 JSON schema，无校验逻辑） |
| **描述** | 所有 LLM 场景依赖 DeepSeek 返回符合 schema 的 JSON，但未定义输出校验层。以下情况未处理：**(a)** `speaker_id` 不在已知 Panelist UUID 列表中（幻觉 UUID）；**(b)** `message_type` 不符合枚举值；**(c)** `panelist_statuses` 未覆盖全部嘉宾（遗漏）；**(d)** 场景 A `experts` 数组长度 ≠ `expert_count`；**(e)** 场景 C `type` 字段为 `"CONSENSUS"` 但 LLM 返回 `"consensus"`（大小写不匹配）。 |
| **影响** | 一次 LLM 幻觉即可污染数据库（例如写入不存在的 panelist_id 导致外键约束违反），或导致 WS 推送格式异常使前端崩溃。 |
| **修复建议** | 在 `04-llm-protocol.md` 或新建 `05-validation-layer.md` 中定义每个场景的输出校验规则：`speaker_id ∈ known_panelists`、`message_type ∈ MessageType`、专家数校验、大小写标准化等。校验失败时触发重试，重试仍失败按错误处理策略（§2.2）降级。 |

### M-09 · 状态机存在不可达转换——"全部重新生成嘉宾"无 API 入口

| 维度 | 详情 |
|------|------|
| **位置** | `01-domain-model.md` §1.1 状态流转图 |
| **描述** | 状态流转图定义 `PANEL_READY → PENDING_PANEL` 转换（注释："用户替换专家（重新生成部分）*"），但脚注说明仅"全部重新生成"才触发。当前 API 仅提供了 `POST /panel/generate`（需 PENDING_PANEL 状态）和 `PUT /panel/{pid}`（替换单个，保持 PANEL_READY），**不存在"全部重新生成"的 API 端点**。 |
| **影响** | 状态机中 `PANEL_READY → PENDING_PANEL` 转换在当前 API 契约下**不可达**。用户无法触发全部嘉宾重新生成。 |
| **修复建议** | 二选一：**(a)** 新增 `POST /api/discussions/{id}/panel/regenerate` 端点，将状态回退至 PENDING_PANEL 后重新调用场景 A；**(b)** 删除状态机中该转换，明确"不支持全部重新生成，仅支持逐位替换"（需用户确认）。 |

### M-10 · Panelist 状态机与 WS 时序不一致——主持人跳过 PREPARING

| 维度 | 详情 |
|------|------|
| **位置** | `01-domain-model.md` §1.2 Panelist 状态流转图；`02-api-contract.md` §3.4 WS 时序 |
| **描述** | Panelist 状态机严格定义 `STANDBY → PREPARING → SPEAKING`，**不存在** `STANDBY → SPEAKING` 直通路径。但 WS 时序示例中，主持人直接从无状态变为 SPEAKING（开场即发言），未经历 PREPARING 阶段。 |
| **影响** | 若严格按状态机实现，主持人开场前必须经过 PREPARING——但主持人是自己叫自己发言，"准备"状态对用户无意义。严格实现会导致多余的状态推送。 |
| **修复建议** | 在状态流转图中增加 `STANDBY → SPEAKING` 直通路径（标注：仅主持人 HOST 可直通，或开场第 1 轮可直通）。或者在 WS 时序中去掉主持人跳过 PREPARING 的描述，改为所有发言人均经 PREPARING → SPEAKING。 |

---

## 🟡 Minor（11 项）

### m-01 · API Transcript 响应含非实体字段——未在领域模型中声明

| 位置 | `02-api-contract.md` §2.4 transcript 响应；`01-domain-model.md` §1.3 Message 实体 |
|------|------|
| **描述** | Transcript 和 latest_messages 响应中包含 `panelist_name`、`panelist_title`、`panelist_color` 三个字段，均不属于 Message 实体——它们是 Panelist 实体的 JOIN 字段。领域模型未标记这些为"衍生字段"或"视图字段"。 |
| **修复建议** | 在 `01-domain-model.md` Message 实体下增加"API 视图衍生字段"小节，标注 `panelist_name`/`panelist_title`/`panelist_color` 为 JOIN 填充。 |

### m-02 · 缺失 `discussion_started` 和 `panel_generated` WS 事件

| 位置 | `02-api-contract.md` §3.2 事件类型表 |
|------|------|
| **描述** | `/start` 成功后讨论引擎启动，但 WS 客户端无明确"引擎已启动"信号——需等待首个 `new_message` 才知道讨论开始。若引擎启动失败（首次 LLM 调用报错），客户端无法区分"未开始"和"即将开始"。同样，`/panel/generate` 完成后 WS 未通知。 |
| **修复建议** | 增加 `discussion_started` 事件（引擎成功启动后立即推送）和 `panel_generated` 事件（嘉宾生成/替换完成后推送），便于多 Tab 同步和启动失败检测。 |

### m-03 · HTTP 400 vs 422 校验错误码与 FastAPI 框架不一致

| 位置 | `02-api-contract.md` §4 错误码汇总 |
|------|------|
| **描述** | 错误码表中 Pydantic 校验失败返回 400，但 FastAPI 原生行为是返回 **422 Unprocessable Entity**。若项目使用 FastAPI 默认配置，实际响应码与文档不符。 |
| **修复建议** | 将"请求参数校验失败"的错误码从 400 改为 422，或在 FastAPI 中全局覆盖为 400（需显式配置 `HTTP_400_BAD_REQUEST` 替代默认）。推荐改为 422 与框架一致。 |

### m-04 · 共识提炼触发条件实现偏差——`random.randint` 不保证间隔均匀

| 位置 | `04-llm-protocol.md` §4.5 引擎伪代码 |
|------|------|
| **描述** | 共识提炼目标为"每 3–5 次发言"，但伪代码使用 `len(messages) % random.randint(3, 5) == 0`，每次迭代重新随机取模基数，实际间隔不可预测（可能连续提炼或长时间不提炼）。 |
| **修复建议** | 改为确定性逻辑：`if message_count % target_interval == 0: extract(); target_interval = random.randint(3, 5)`，即每次提炼后设定下一次目标间隔。 |

### m-05 · LLM Prompt 中包含未经确认的行为扩展

| 位置 | `04-llm-protocol.md` §4.2 场景 B System Prompt |
|------|------|
| **描述** | 场景 B Prompt 包含以下未经用户确认的规则：①"前 3 轮优先让不同专家发表初始观点"；②"中段鼓励观点碰撞（补充/反驳）"；③"后段推动共识形成"；④"整个讨论控制在 10-20 轮为宜"；⑤"让主持人暗示'是否需要总结'"。其中④和⑤与用户确认的"由用户手动点击结束讨论按钮触发"存在张力——LLM 可能主动引导结束。 |
| **修复建议** | 移除⑤（主持人暗示总结）和④中的轮数引导。①②③保留作为 Prompt 工程策略但需标注为"软引导"（非强制性业务规则）。 |

### m-06 · 场景 E 缺少 User Message 模板

| 位置 | `04-llm-protocol.md` §7 场景 E |
|------|------|
| **描述** | 其他场景均包含 System Prompt + User Message 两部分。场景 E 仅有 System Prompt，缺少 `{topic}` 和上下文填充的 User Message。 |
| **修复建议** | 补充场景 E User Message 模板：`话题：{topic}\n\n请为以下阵容生成一位替代专家：\n{existing_panelists_text}\n\n被替换专家：{replaced_panelist_name}（{replaced_panelist_stance}）`。 |

### m-07 · WS 事件发送顺序文档间不一致

| 位置 | `02-api-contract.md` §3.4 时序图；`04-llm-protocol.md` §4.5 引擎伪代码 |
|------|------|
| **描述** | API 文档时序图：`panelist_status`（主持人→SPEAKING）→ `new_message`（开场）→ `panelist_status`（主持人→STANDBY）。引擎伪代码：先 `broadcast("new_message")` 后 `broadcast("panelist_status")`。两者**顺序相反**。 |
| **修复建议** | 统一为先更新状态再推送消息，或明确标注两事件无顺序依赖（前端不得假设顺序）。推荐：`panelist_status`（发言人→SPEAKING）→ `new_message` → `panelist_status`（发言人→STANDBY）。 |

### m-08 · 部分端点错误条件未显式列出

| 位置 | `02-api-contract.md` §2.3 /start、/end、DELETE 端点 |
|------|------|
| **描述** | `/panel/generate` 显式列出了 404/409/502 错误，但 `/start`、`/end`、`DELETE` 未列出其错误条件。DELETE 在讨论 IN_PROGRESS 时是否允许？若允许，引擎 Task 如何处理？ |
| **修复建议** | 为每个端点补充错误条件表，与 `/panel/generate` 格式一致。DELETE IN_PROGRESS 讨论需特别标注：强制停止引擎 Task + 级联删除。 |

### m-09 · `POST /start` 缺少 409 的显式错误响应说明

| 位置 | `02-api-contract.md` §2.3 /start 端点 |
|------|------|
| **描述** | /start 的文字说明为"仅在 PANEL_READY 状态下可用"，但未像 /panel/generate 那样列出 409 错误。实现者可能遗漏此校验。 |
| **修复建议** | 补充错误条件表：404（讨论不存在）、409（讨论不在 PANEL_READY）。 |

### m-10 · 非确定性规则的测试覆盖率无法验证

| 位置 | 多处 |
|------|------|
| **描述** | 以下规则依赖 LLM 输出，无确定性的程序化验证方式：**(a)** "每次发言控制在 1-2 句"——可做句子分割计数但中文句法模糊；**(b)** "禁止机械式轮流发言"——可检测连续N条消息是否来自不同 panelist，但无法区分"合理轮流"和"机械轮流"；**(c)** "至少 2 组对立的立场维度"——立场"对立"是语义判断；**(d)** "共识提炼去重"——使用"简单关键词重叠判重"，阈值未定义。 |
| **修复建议** | 在 `04-llm-protocol.md` 中为每个非确定性规则定义可程序化验证的近似标准（如：发言不超过 150 字符、统计发言方分布熵值≥阈值、共识去重 Jaccard 系数≥0.7），并标注为"软校验"（警告而非阻断）。 |

### m-11 · 色板中主持人颜色硬编码且与示例矛盾

| 位置 | `04-llm-protocol.md` §3.5 |
|------|------|
| **描述** | `PANELIST_COLORS` 列表索引顺序为 `[#FF6B6B, #4ECDC4, ...]`，主持人固定使用索引 1 的 `#4ECDC4`。但 API 示例（02 §2.2）中第一位专家使用 `#FF6B6B`——这要求跳过已被主持人占用的 `#4ECDC4`。色板分配逻辑（"专家按序分配其余颜色"）对"其余颜色"的定义不精确——是按原始顺序跳过已用色，还是从去除主持人色后的列表按序分配？两种策略在专家数≥7 时结果不同。 |
| **修复建议** | 明确色板分配算法伪代码：`expert_colors = [c for c in PANELIST_COLORS if c != HOST_COLOR]`，然后按 index 分配。 |

---

## 🟢 Suggestion（6 项）

### S-01 · 建议 WS 事件增加单调递增序列号

每一条 WS 事件携带 `sequence_id`，客户端可据此检测丢包和去重。当前仅有 `new_message` 中的 `sequence` 字段（那是发言序号，不是事件序号）。

### S-02 · 建议增加 `discussion_deleted` WS 事件

多 Tab 场景：Tab A 删除讨论后，Tab B 的 WS 连接应收到通知并关闭连接或跳转。当前无此事件。

### S-03 · 建议补充 429（Rate Limit）和 503（Service Unavailable）错误码

DeepSeek API 可能返回 429（频率限制）或 503（服务不可用）。建议在错误码表中预留，并在 `04-llm-protocol.md` §2.2 错误处理中增加指数退避重试策略。

### S-04 · 建议共识去重定义明确阈值

当前 `04-llm-protocol.md` §5.4 写"可用简单关键词重叠判重"，过于模糊。建议给出具体方案：`Jaccard 相似度 = |A ∩ B| / |A ∪ B| ≥ 0.6 视为重复`。

### S-05 · 建议 `POST /end` 支持幂等性

若对已 ENDED 的讨论再次调用 `/end`，应返回 200 + 已有总结（而非 409），便于前端做安全的"结束讨论"按钮（用户可能双击）。

### S-06 · 建议 `03-database-schema.md` 补充 ER 图中各关系基数的业务注释

当前 ER 图仅有 Mermaid 语法注释（如 "1:N"），建议在表下增加类似 `01-domain-model.md` §3 的业务不变量说明，例如：Discussion:Panelist 的基数 = `1 : (1 + expert_count)`。

---

## 附录：文档间交叉引用验证矩阵

| 实体/字段 | 01 领域模型 | 02 API 契约 | 03 DB Schema | 04 LLM 协议 | 一致性 |
|-----------|------------|------------|-------------|------------|--------|
| Discussion.id | str UUID | "uuid" | TEXT PK | — | ✅ |
| Discussion.topic | str | str (1-200) | TEXT NOT NULL | {topic} | ✅ |
| Discussion.expert_count | int [4,8] | int [4,8] | INTEGER CHECK | {expert_count} | ✅ |
| Discussion.status | 4 values | 4 values | 4 CHECK values | — | ✅ |
| Panelist.role | HOST, EXPERT | HOST, EXPERT | CHECK 2 values | HOST\|EXPERT | ✅ |
| Panelist.status | 3 values | 3 values | CHECK 3 values | STANDBY\|PREPARING\|SPEAKING | ✅ |
| Panelist.color | str (#RRGGBB) | "#4ECDC4" etc | TEXT | 8-color palette | 🔴 B-01 |
| Message.message_type | 7 values (含 SUMMARY) | 6 values (样例) | CHECK 7 values | 6 values (场景B) | 🟠 M-01 |
| ConsensusPoint.point_type | CONSENSUS, DISAGREEMENT | 2 values | CHECK 2 values | CONCENSUS\|DISAGREEMENT (typo) | ⚠️ 见注 |
| Discussion 状态机 | 4 states + 5 transitions | 3 endpoints enforce | — | — | 🟠 M-09 |
| Panelist 状态机 | 3 states + 3 transitions | WS 时序中主持人直跳 | — | — | 🟠 M-10 |

> 注：`04-llm-protocol.md` 场景 C 输出 schema 中 `"type": "CONSENSUS|DISAGREEMENT"` 是字面值，LLM 实际返回可能是 `"type": "CONSENSUS"`（与数据库 `point_type` 字段名不一致——数据库用 `point_type`，LLM 输出用 `type`）。映射关系需在处理层明确。

---

## 审查结论

SDD 四份文档在**实体定义、枚举值、字段类型**层面基本一致，状态机设计方向正确。主要风险集中在：

1. **容量边界**（B-01：色板不足）——必须在实现前修复；
2. **可靠性缺口**（M-03/M-05/M-06/M-07）——并发、重连、崩溃恢复、SQLite 并发写四个维度均未覆盖，可能导致运行时数据不一致；
3. **LLM 防御层缺失**（M-08）——对非确定性 AI 输出无校验，是最大的工程质量风险；
4. **规格内矛盾**（M-02/M-04/M-09/M-10）——4 处文档间逻辑不一致，需逐一确认后修正。

建议在进入 DDD/TDD 阶段前，先修复所有 Blocker 和 Major 项。
