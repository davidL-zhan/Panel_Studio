# API 文档

> AI Panel Studio · REST + WebSocket · v1.0

---

## 基础约定

| 项目 | 约定 |
|------|------|
| Base URL | `http://localhost:8000/api` |
| Content-Type | `application/json` |
| 字符编码 | UTF-8 |
| 时间格式 | ISO 8601 北京时间 (`2026-08-05T21:18:47+08:00`) |
| ID 格式 | UUID v4 |
| 错误响应 | `{ "detail": "错误描述" }`（校验错误 422，含 `detail` 数组） |

---

## REST 端点

### 讨论管理

#### `GET /api/discussions`

列出所有讨论（按创建时间倒序）。

```json
// Response 200
[{
  "id": "uuid", "topic": "AI 会取代人类创造力吗？",
  "expert_count": 5, "status": "IN_PROGRESS",
  "created_at": "2026-08-05T21:18:47+08:00",
  "updated_at": "2026-08-05T21:18:47+08:00"
}]
```

#### `POST /api/discussions`

创建新讨论。

| 字段 | 类型 | 必填 | 校验 |
|------|------|------|------|
| `topic` | `string` | ✅ | 1–200 字符 |
| `expert_count` | `int` | | 默认 4，范围 [4, 8] |

```json
// Request
{ "topic": "AI 会取代人类创造力吗？", "expert_count": 5 }

// Response 201
{ "id": "uuid", "topic": "...", "expert_count": 5, "status": "PENDING_PANEL", "created_at": "...", "updated_at": "..." }
```

#### `GET /api/discussions/{id}`

获取讨论详情（含嘉宾、最近 500 条发言、共识）。

```json
// Response 200
{
  "id": "uuid", "topic": "...", "expert_count": 5, "status": "IN_PROGRESS",
  "panelists": [{ "id": "uuid", "name": "张明远", "role": "HOST", "profession": "...", "title": "...", "stance": "...", "color": "#4ECDC4", "status": "STANDBY", "current_focus": null, "sort_order": 0 }],
  "latest_messages": [{ "id": "uuid", "panelist_id": "uuid", "panelist_name": "...", "panelist_title": "...", "panelist_color": "...", "content": "...", "message_type": "ANSWER", "sequence": 3, "created_at": "..." }],
  "consensus_points": [{ "id": "uuid", "point_type": "DISAGREEMENT", "content": "...", "message_range_start": 1, "message_range_end": 5, "generated_at": "..." }]
}
```

#### `DELETE /api/discussions/{id}`

删除讨论及所有关联数据。若 `IN_PROGRESS` 先停止引擎再级联删除。

```
Response 204
```

---

### 嘉宾管理

#### `POST /api/discussions/{id}/panel/generate`

调用 LLM 生成嘉宾阵容（仅 `PENDING_PANEL`）。

```json
// Response 200
{ "host": { "id": "uuid", "name": "...", "role": "HOST", "profession": "...", "title": "...", "stance": "...", "color": "#4ECDC4", "sort_order": 0 },
  "experts": [{ "id": "uuid", "name": "...", "role": "EXPERT", "profession": "...", "title": "...", "stance": "...", "color": "#FF6B6B", "sort_order": 1 }] }
```

| 错误 | 含义 |
|------|------|
| 404 | 讨论不存在 |
| 409 | 非 `PENDING_PANEL` |
| 502 | LLM 调用失败 |

#### `GET /api/discussions/{id}/panel`

获取当前嘉宾阵容。响应同 `POST .../generate`。

#### `PUT /api/discussions/{id}/panel/{pid}`

替换单个专家（仅 `PANEL_READY`）。请求体为空，后端自动调用 LLM 生成替代专家。**非幂等**。

| 错误 | 含义 |
|------|------|
| 404 | 嘉宾不存在 |
| 400 | 尝试替换主持人 |
| 409 | 非 `PANEL_READY` |
| 502 | LLM 调用失败 |

#### `POST /api/discussions/{id}/panel/regenerate`

全部重新生成嘉宾（仅 `PANEL_READY`）。状态回退至 `PENDING_PANEL` 后重新生成。

---

### 讨论控制

#### `POST /api/discussions/{id}/start`

开始讨论（仅 `PANEL_READY`）。使用原子乐观锁 `UPDATE WHERE status='PANEL_READY'`。

```json
// Response 200
{ "status": "IN_PROGRESS", "message": "讨论已开始，请通过 WebSocket 接收实时事件" }
```

#### `POST /api/discussions/{id}/end`

结束讨论（仅 `IN_PROGRESS`）。**幂等**：已 `ENDED` 返回已有总结。

引擎停止 → 生成主持人总结 → 写入 SUMMARY Message → 推送 `discussion_ended` 事件 → 返回总结。

```json
// Response 200
{ "status": "ENDED", "summary": "主持人自然语言总结..." }
```

#### `POST /api/discussions/{id}/continue`

恢复暂停的讨论（每 30 轮自动暂停后）。

```json
// Response 200
{ "status": "ok", "message": "讨论继续" }
```

---

### 数据查询

#### `GET /api/discussions/{id}/transcript`

分页获取 Transcript。

| 参数 | 类型 | 默认值 |
|------|------|--------|
| `offset` | int | 0 |
| `limit` | int | 50 |

```json
// Response 200
{ "total": 35, "messages": [{ "id": "uuid", "panelist_id": "uuid", "panelist_name": "...", "panelist_title": "...", "panelist_color": "...", "content": "...", "message_type": "ANSWER", "sequence": 3, "created_at": "..." }] }
```

#### `GET /api/discussions/{id}/consensus`

获取全部共识与分歧。

```json
// Response 200
[{ "id": "uuid", "point_type": "DISAGREEMENT", "content": "...", "message_range_start": 1, "message_range_end": 5, "generated_at": "..." }]
```

---

## WebSocket 协议

### 连接

```
ws://localhost:8000/ws/discussions/{discussion_id}
```

任何状态均可连接。连接后立即推送 `initial_state`。重连时携带 `?last_seq=N` 追赶遗漏事件。

### 服务端 → 客户端事件

所有事件结构：`{ "event": "<类型>", "sequence_id": 42, "data": { ... }, "timestamp": "..." }`

| 事件 | 触发时机 | data |
|------|----------|------|
| `initial_state` | 连接建立 | discussion_status, latest_messages, consensus_points, panelists |
| `discussion_started` | 引擎启动 | topic, panelist_count |
| `panel_generated` | 嘉宾生成/替换完成 | host, experts |
| `panelist_status` | 状态变化（批量） | panelists: [{ id, status, current_focus }] |
| `new_message` | 每次发言 | message（同 REST transcript 结构） |
| `consensus_update` | 每 3–5 次发言 | points（全量替换） |
| `host_prompt` | 每 30 轮自动暂停 | message, summary（阶段总结） |
| `discussion_paused` | 60s 未确认暂停 | message |
| `discussion_ended` | 讨论结束 | summary, total_messages |
| `discussion_deleted` | 讨论删除 | discussion_id |
| `error` | 错误 | message, recoverable |

### 客户端 → 服务端

```json
{ "type": "ping", "last_seq": 42 }
{ "type": "continue" }
```

---

## 错误码

| Status | 含义 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 204 | 删除成功 |
| 400 | 业务校验失败 |
| 404 | 资源不存在 |
| 409 | 状态冲突 |
| 422 | 参数校验失败（Pydantic） |
| 429 | LLM 频率限制 |
| 502 | LLM 调用失败 |
| 503 | LLM 服务不可用 |
| 500 | 服务器内部错误 |
