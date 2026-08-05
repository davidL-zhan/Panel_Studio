# 02 — API 契约

> SDD 阶段 · REST + WebSocket · AI Panel Studio

---

## 1. 基础约定

| 项目 | 约定 |
|------|------|
| Base URL | `http://localhost:8000/api` |
| Content-Type | `application/json` |
| 字符编码 | UTF-8 |
| 时间格式 | ISO 8601 (`2026-08-05T12:00:00Z`) |
| ID 格式 | UUID v4 字符串 |
| 错误响应格式 | `{ "detail": "错误描述" }` |

---

## 2. REST 端点

### 2.1 讨论管理

#### `GET /api/discussions`

列出所有讨论（按创建时间倒序）。

**Response 200:**
```json
[
  {
    "id": "uuid",
    "topic": "AI 会取代人类创造力吗？",
    "expert_count": 5,
    "status": "IN_PROGRESS",
    "created_at": "2026-08-05T10:00:00Z",
    "updated_at": "2026-08-05T10:05:00Z"
  }
]
```

---

#### `POST /api/discussions`

创建新讨论。

**Request Body:**
```json
{
  "topic": "AI 会取代人类创造力吗？",
  "expert_count": 5
}
```

| 字段 | 类型 | 必填 | 校验 |
|------|------|------|------|
| `topic` | `str` | ✅ | 1–200 字符，非空 |
| `expert_count` | `int` | | 默认 4，范围 [4, 8] |

**Response 201:**
```json
{
  "id": "uuid",
  "topic": "AI 会取代人类创造力吗？",
  "expert_count": 5,
  "status": "PENDING_PANEL",
  "created_at": "2026-08-05T10:00:00Z",
  "updated_at": "2026-08-05T10:00:00Z"
}
```

---

#### `GET /api/discussions/{discussion_id}`

获取讨论详情（含嘉宾列表、transcript 摘要）。

**Response 200:**
```json
{
  "id": "uuid",
  "topic": "AI 会取代人类创造力吗？",
  "expert_count": 5,
  "status": "IN_PROGRESS",
  "created_at": "2026-08-05T10:00:00Z",
  "updated_at": "2026-08-05T10:15:00Z",
  "panelists": [
    {
      "id": "uuid",
      "name": "张明远",
      "role": "HOST",
      "profession": "科技媒体主编",
      "title": "圆桌主持人",
      "stance": "中立主持",
      "color": "#4ECDC4",
      "status": "STANDBY",
      "current_focus": null,
      "sort_order": 0
    },
    {
      "id": "uuid",
      "name": "李思涵",
      "role": "EXPERT",
      "profession": "AI 研究员",
      "title": "前 OpenAI 科学家",
      "stance": "AI 将极大拓展人类创造力边界",
      "color": "#FF6B6B",
      "status": "SPEAKING",
      "current_focus": "准备引用最新神经科学研究",
      "sort_order": 1
    }
  ],
  "latest_messages": [
    {
      "id": "uuid",
      "panelist_id": "uuid",
      "panelist_name": "张明远",
      "panelist_color": "#4ECDC4",
      "content": "...",
      "message_type": "QUESTION",
      "sequence": 1,
      "created_at": "2026-08-05T10:05:00Z"
    }
  ],
  "consensus_points": [
    {
      "id": "uuid",
      "point_type": "DISAGREEMENT",
      "content": "对'创造力'的定义存在根本分歧",
      "message_range_start": 1,
      "message_range_end": 5,
      "generated_at": "2026-08-05T10:10:00Z"
    }
  ]
}
```

> 注：`latest_messages` 返回最近 20 条；完整 transcript 通过独立端点获取。

---

#### `DELETE /api/discussions/{discussion_id}`

删除讨论及其所有关联数据（Panelist、Message、ConsensusPoint）。

**Response 204:** 无响应体。

---

### 2.2 嘉宾管理

#### `POST /api/discussions/{discussion_id}/panel/generate`

调用 DeepSeek API 生成嘉宾阵容。仅在 `PENDING_PANEL` 状态下可用。

**Response 200:**
```json
{
  "host": {
    "id": "uuid",
    "name": "张明远",
    "role": "HOST",
    "profession": "科技媒体主编",
    "title": "资深圆桌主持人",
    "stance": "中立主持",
    "color": "#4ECDC4",
    "sort_order": 0
  },
  "experts": [
    {
      "id": "uuid",
      "name": "李思涵",
      "role": "EXPERT",
      "profession": "AI 研究员",
      "title": "前 OpenAI 科学家",
      "stance": "AI 将极大拓展人类创造力边界",
      "color": "#FF6B6B",
      "sort_order": 1
    }
  ]
}
```

| 状态约束 | 错误 |
|----------|------|
| Discussion 不存在 | 404 |
| Discussion 不在 `PENDING_PANEL` | 409 |
| DeepSeek API 错误 | 502 |

---

#### `GET /api/discussions/{discussion_id}/panel`

获取当前讨论的嘉宾阵容。

**Response 200:** 同 `POST .../generate` 的响应结构。

---

#### `PUT /api/discussions/{discussion_id}/panel/{panelist_id}`

替换单个专家。仅在 `PANEL_READY` 状态下可用，且 `panelist_id` 对应的 Panelist 必须是 `role=EXPERT`（不能替换主持人）。

**Request Body:**
```json
{
  "name": "替换姓名",
  "profession": "替换职业",
  "title": "替换头衔",
  "stance": "替换立场"
}
```

> 注：替换专家的数据来自一次新的 LLM 调用（传入话题 + 已有阵容上下文，要求生成一个不同立场的替代专家）。

**Response 200:** 返回更新后的完整 Panelist 对象。

| 状态约束 | 错误 |
|----------|------|
| Panelist 不存在 | 404 |
| Panelist 是 HOST | 400 |
| Discussion 不在 `PANEL_READY` | 409 |

---

### 2.3 讨论控制

#### `POST /api/discussions/{discussion_id}/start`

确认阵容并开始讨论。仅在 `PANEL_READY` 状态下可用。

**Response 200:**
```json
{
  "status": "IN_PROGRESS",
  "message": "讨论已开始，请通过 WebSocket 接收实时事件"
}
```

> 后端收到请求后立即：①将状态置为 `IN_PROGRESS` ②启动后台异步讨论引擎 ③返回 200。后续事件通过 WebSocket 推送。

---

#### `POST /api/discussions/{discussion_id}/end`

用户手动结束讨论。仅在 `IN_PROGRESS` 状态下可用。

**Response 200:**
```json
{
  "status": "ENDED",
  "summary": "主持人自然语言总结文本..."
}
```

> 后端收到请求后：①向讨论引擎发送停止信号 ②引擎触发主持人总结（一次 LLM 调用）③将状态置为 `ENDED` ④返回总结 ⑤通过 WebSocket 推送 `discussion_ended` 事件。

---

### 2.4 数据查询

#### `GET /api/discussions/{discussion_id}/transcript`

获取完整 Transcript。支持分页。

**Query Parameters:**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `offset` | `int` | 0 | 偏移量 |
| `limit` | `int` | 50 | 每页条数，最大 200 |

**Response 200:**
```json
{
  "total": 35,
  "messages": [
    {
      "id": "uuid",
      "panelist_id": "uuid",
      "panelist_name": "李思涵",
      "panelist_title": "前 OpenAI 科学家",
      "panelist_color": "#FF6B6B",
      "content": "我认为 AI 不是在取代创造力，而是在放大人类的创造潜能。",
      "message_type": "ANSWER",
      "sequence": 3,
      "created_at": "2026-08-05T10:06:00Z"
    }
  ]
}
```

---

#### `GET /api/discussions/{discussion_id}/consensus`

获取所有共识与分歧。

**Response 200:**
```json
[
  {
    "id": "uuid",
    "point_type": "DISAGREEMENT",
    "content": "对\"创造力\"的定义存在根本分歧 — 人文派认为需包含意图性，技术派认为产出即创造",
    "message_range_start": 1,
    "message_range_end": 5,
    "generated_at": "2026-08-05T10:10:00Z"
  }
]
```

---

## 3. WebSocket 协议

### 3.1 连接

```
ws://localhost:8000/ws/discussions/{discussion_id}
```

连接建立后，服务端在讨论进行期间持续推送事件。连接无认证，但仅推送指定 `discussion_id` 的事件流。

### 3.2 服务端 → 客户端事件

所有事件均为 JSON 格式，结构如下：

```json
{
  "event": "<事件类型>",
  "data": { ... },
  "timestamp": "2026-08-05T10:05:00Z"
}
```

| 事件类型 | 触发时机 | `data` 内容 |
|----------|----------|-------------|
| `panelist_status` | 嘉宾状态变化时（批量） | `{ "panelists": [{ "id", "status", "current_focus" }] }` |
| `new_message` | 每次发言 | `Message` 对象（同 REST transcript 结构） |
| `consensus_update` | 每 3–5 次发言后 | `{ "points": [ConsensusPoint] }`（全量替换本次讨论的共识/分歧列表） |
| `discussion_ended` | 讨论结束时 | `{ "summary": "主持人总结文本" }` |
| `error` | 发生错误时 | `{ "message": "错误描述", "recoverable": true/false }` |

### 3.3 客户端 → 服务端

客户端可发送心跳，当前不承载业务指令（讨论控制通过 REST）：

```json
{ "type": "ping" }
```

服务端响应：
```json
{ "type": "pong" }
```

### 3.4 WebSocket 时序示例

```
Client                          Server
  |                                |
  |--- WS CONNECT /ws/disc/{id} -->|
  |                                |  (后台讨论引擎运行中)
  |<--- panelist_status ----------|  "张明远" → SPEAKING
  |<--- new_message --------------|  主持人开场
  |<--- panelist_status ----------|  "张明远" → STANDBY
  |<--- panelist_status ----------|  "李思涵" → PREPARING
  |<--- panelist_status ----------|  "李思涵" → SPEAKING
  |<--- new_message --------------|  李思涵发言
  |                                |
  |  (经过 3-5 轮发言后)            |
  |<--- consensus_update ---------|  第 1 批共识/分歧
  |                                |
  |--- REST POST /end ----------->|  用户点击结束
  |<--- REST 200 (含总结) --------|
  |<--- discussion_ended ---------|  WS 事件
  |                                |
  |--- WS DISCONNECT ------------->|
```

---

## 4. 错误码汇总

| HTTP Status | 含义 |
|-------------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 204 | 删除成功（无响应体） |
| 400 | 请求参数校验失败 |
| 404 | 资源不存在 |
| 409 | 状态冲突（操作在当前状态下不可用） |
| 502 | 上游 LLM API 错误 |
| 500 | 服务器内部错误 |

---

## 5. API 端点矩阵

```
GET    /api/discussions                    列出讨论
POST   /api/discussions                    创建讨论
GET    /api/discussions/{id}               讨论详情
DELETE /api/discussions/{id}               删除讨论

POST   /api/discussions/{id}/panel/generate  生成嘉宾
GET    /api/discussions/{id}/panel           查看嘉宾
PUT    /api/discussions/{id}/panel/{pid}     替换专家

POST   /api/discussions/{id}/start         开始讨论
POST   /api/discussions/{id}/end           结束讨论

GET    /api/discussions/{id}/transcript    完整 Transcript
GET    /api/discussions/{id}/consensus     共识/分歧列表

WS     /ws/discussions/{id}                实时事件流
```
