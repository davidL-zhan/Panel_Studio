# 03 — User Flow

> DDD 阶段 · 用户流程 · AI Panel Studio

---

## 1. 创建讨论

```mermaid
flowchart TD
    A[首页] --> B[输入讨论话题]
    B --> C{话题校验}
    C -->|为空或超长| B
    C -->|通过| D[选择专家人数 4-8]
    D -->|默认 4| E["点击「创建讨论」"]
    E --> F[POST /api/discussions]
    F -->|201| G[跳转讨论详情页 status=PENDING_PANEL]
    F -->|422/500| H[Toast 错误提示]
    G --> I[自动触发生成嘉宾]
```

---

## 2. 生成嘉宾阵容

```mermaid
flowchart TD
    A[讨论详情页 PENDING_PANEL] --> B["显示「正在生成嘉宾阵容...」加载态"]
    B --> C[POST /api/discussions/:id/panel/generate]
    C -->|200| D[嘉宾阵容展示 + status → PANEL_READY]
    C -->|502 LLM 错误| E["Toast: 「嘉宾生成失败，请重试」"]
    E --> F["显示「重新生成」按钮"]
    F -->|点击| B
```

---

## 3. 替换单个专家

```mermaid
flowchart TD
    A[嘉宾阵容 PANEL_READY] --> B["点击某专家卡片的「替换」按钮"]
    B --> C[PUT /api/discussions/:id/panel/:pid]
    C --> D{请求体为空，后端调用 LLM}
    D -->|200| E[该专家卡片更新为新专家]
    D -->|400/409/502| F[Toast 错误]
    E --> G[WS 推送 panel_generated 事件]
```

**同时发生：**

- 专家卡片短暂显示替换中状态（skeleton/浅灰色块）
- 替换完成后卡片内容平滑过渡到新专家（fade transition 200ms）

---

## 4. 全部重新生成

```mermaid
flowchart TD
    A[嘉宾阵容 PANEL_READY] --> B["点击全部重新生成按钮"]
    B --> C["二次确认对话框: 「确定重新生成全部嘉宾？」"]
    C -->|取消| A
    C -->|确认| D[POST /api/discussions/:id/panel/regenerate]
    D -->|200| E[status → PENDING_PANEL → PANEL_READY]
    E --> F[全新嘉宾阵容展示]
    D -->|409/502| G[Toast 错误]
```

---

## 5. 确认阵容并开始讨论

```mermaid
flowchart TD
    A[嘉宾阵容 PANEL_READY] --> B[用户确认阵容无误]
    B --> C["点击「开始讨论」"]
    C --> D[POST /api/discussions/:id/start]
    D -->|200| E[status → IN_PROGRESS]
    E --> F[演播厅视图渲染]
    F --> G[建立 WS 连接 /ws/discussions/:id]
    G --> H[收到 initial_state 事件]
    H --> I[收到 discussion_started 事件]
    I --> J[演播厅开始接收实时事件]
    D -->|409 状态冲突| K["Toast: 「当前状态不允许开始讨论」"]
```

---

## 6. 实时观看讨论

```mermaid
flowchart TD
    A[演播厅 IN_PROGRESS] --> B[WS 事件循环]
    B --> C{事件类型}
    C -->|panelist_status| D[更新嘉宾状态视觉]
    C -->|new_message| E[当前发言区更新 + Transcript 追加]
    C -->|consensus_update| F[共识/分歧面板全量刷新]
    C -->|error| G[错误处理]

    D --> H{发言人是谁?}
    H --> I[当前发言人视觉聚焦: 边框高亮 2px + 背景微提亮 +10%]
    H --> J[其他嘉宾退为次要: 降低透明度]

    E --> K[Transcript 自动滚动到底部]
    K -->|用户手动上滚| L["暂停自动滚动 + 显示「回到底部」按钮"]
    L -->|点击「回到底部」| K

    F --> M{有新共识/分歧?}
    M -->|是| N[新增条目短暂高亮 1s]
    M -->|否| O[无变化]
```

---

## 7. 手动结束讨论

```mermaid
flowchart TD
    A[演播厅 IN_PROGRESS] --> B["点击「结束讨论」按钮"]
    B --> C["二次确认对话框: 「确定结束当前讨论？」"]
    C -->|取消| A
    C -->|确认| D[POST /api/discussions/:id/end]
    D --> E["按钮显示「正在生成总结...」"]
    E --> F{后端处理}
    F -->|200| G[status → ENDED]
    G --> H[演播厅切换为结束视图]
    H --> I[展示主持人总结]
    I --> J[WS 推送 discussion_ended]
    F -->|超时 30s| K["Toast: 「总结生成超时」"]
    F -->|409| L["Toast: 「讨论已结束」 幂等返回"]
```

---

## 8. 删除讨论

```mermaid
flowchart TD
    A[任意讨论状态] --> B["点击删除讨论"]
    B --> C["二次确认: 「确定删除此讨论？所有数据不可恢复。」"]
    C -->|取消| A
    C -->|确认| D[DELETE /api/discussions/:id]
    D -->|204| E[WS 推送 discussion_deleted]
    E --> F[跳转回首页]
    D -->|404| G["Toast: 「讨论不存在」"]
```

---

## 9. WebSocket 断线重连

```mermaid
flowchart TD
    A[WS 已连接] --> B{连接中断}
    B --> C["TopBar WS 状态 → 「重连中」"]
    C --> D["Toast: 「连接已断开，正在重连...」"]
    D --> E[客户端指数退避重连]
    E --> F{重连结果}
    F -->|成功| G[WS 发送 ?last_seq=N]
    G --> H[收到 initial_state + 遗漏事件重放]
    H --> I[UI 恢复到最新状态]
    I --> J["Toast: 「连接已恢复」"]
    J --> K["TopBar WS 状态 → 「已连接」"]
    F -->|失败 3 次| L["TopBar WS 状态 → 「已断开」"]
    L --> M["Toast: 「连接失败，请刷新页面」 + 手动重连按钮"]
```

---

## 10. 错误恢复路径

| 场景                             | 用户可见                   | 恢复方式                 |
| -------------------------------- | -------------------------- | ------------------------ |
| LLM API 超时 (502)               | Toast + 重试按钮           | 点击重试                 |
| LLM 频率限制 (429)               | Toast "服务繁忙，稍后重试" | 自动退避重试             |
| LLM 服务不可用 (503)             | Toast "服务暂不可用"       | 手动重试                 |
| WS 不可恢复错误                  | 全屏错误状态 + 刷新按钮    | 浏览器刷新               |
| 讨论引擎崩溃（僵尸 IN_PROGRESS） | Toast "讨论引擎已停止"     | 自动标记 ENDED，提示用户 |
| API 校验错误 (422)               | 字段级错误提示             | 修正输入后重试           |
| 状态冲突 (409)                   | Toast 说明当前状态         | 刷新页面获取最新状态     |

---

## 11. 刷新恢复

```mermaid
flowchart TD
    A[浏览器刷新] --> B[GET /api/discussions/:id]
    B --> C{讨论 status?}
    C -->|PENDING_PANEL| D[渲染 PendingPanelView]
    C -->|PANEL_READY| E[渲染 PanelReadyView]
    C -->|IN_PROGRESS| F[渲染 StudioView + 建立 WS]
    C -->|ENDED| G[渲染 EndedView]
    F --> H[WS initial_state 包含最近 transcript]
    H --> I[从断点恢复观看体验]
```
