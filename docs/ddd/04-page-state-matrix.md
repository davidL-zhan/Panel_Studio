# 04 — Page State Matrix

> DDD 阶段 · 页面状态矩阵 · AI Panel Studio

---

## 1. DiscussionStatus → 页面视图映射

| DiscussionStatus | 页面视图 | URL | 说明 |
|------------------|----------|-----|------|
| `PENDING_PANEL` | `PendingPanelView` | `/discussions/:id` | 话题已创建，等待嘉宾生成 |
| `PANEL_READY` | `PanelReadyView` | `/discussions/:id` | 嘉宾已生成，等待确认 |
| `IN_PROGRESS` | `StudioView` | `/discussions/:id` | 讨论进行中，实时演播厅 |
| `ENDED` | `EndedView` | `/discussions/:id` | 讨论已结束，结果展示 |

---

## 2. PENDING_PANEL 页面状态

| 子状态 | 触发条件 | UI 表现 |
|--------|----------|---------|
| **generating** | POST /panel/generate 请求中 | 嘉宾区域显示 skeleton（4–8 个浅灰占位卡片）+ "正在生成嘉宾阵容..."文案 |
| **generate-error** | API 返回 502/503 | Toast 错误 + "重新生成"按钮 |
| **transition** | 生成成功，status → PANEL_READY | 嘉宾卡片从 skeleton 过渡到实内容（stagger fade-in 300ms） |

---

## 3. PANEL_READY 页面状态

| 子状态 | 触发条件 | UI 表现 |
|--------|----------|---------|
| **default** | 正常展示阵容 | 主持人 + 专家卡片阵列 + "开始讨论"主按钮 |
| **replacing-N** | 替换第 N 位专家中 | 该专家卡片显示浅灰覆盖 + 旋转加载指示器 |
| **replace-error** | 替换 API 失败 | Toast 错误，卡片恢复原内容 |
| **replace-success** | 替换成功 | 新专家内容 fade-in，旧内容 fade-out（200ms 交叉淡入淡出） |
| **regenerating** | 全部重新生成中 | 所有专家卡片变 skeleton |
| **starting** | 点击"开始讨论"，请求中 | 按钮变 loading + "正在启动讨论引擎..." |

---

## 4. IN_PROGRESS 演播厅页面状态

### 4.1 主状态

| 子状态 | 触发条件 | UI 表现 |
|--------|----------|---------|
| **connecting** | WS 连接建立中 | TopBar WS 指示器: 黄色圆点 + "连接中" |
| **connected** | WS 已连接 | TopBar WS 指示器: 绿色圆点 + "已连接"（3s 后自动隐藏文字仅留圆点） |
| **live** | 正在接收事件 | 嘉宾状态实时更新，发言区活跃 |
| **ending** | 用户点击结束，POST /end 请求中 | "结束讨论"按钮变 loading + "正在生成总结..." |

### 4.2 WebSocket 异常状态

| 子状态 | 触发条件 | UI 表现 |
|--------|----------|---------|
| **reconnecting** | WS 断开，自动重连中 | TopBar: 黄色闪烁圆点 + "重连中..." + Toast 通知 |
| **reconnected** | 重连成功 | TopBar: 绿色圆点 + Toast "已恢复"（2s 自动消失） |
| **disconnected** | 重连失败 3 次 | TopBar: 红色圆点 + "已断开" + 全局面板"连接失败，请刷新页面" |
| **error-recoverable** | WS error 事件 recoverable=true | Toast 警告 + 自动重试 |
| **error-unrecoverable** | WS error 事件 recoverable=false | 全屏错误状态 + "讨论引擎已停止" + 刷新按钮 |

### 4.3 Transcript 交互状态

| 子状态 | 触发条件 | UI 表现 |
|--------|----------|---------|
| **auto-scroll** | 用户在 Transcript 底部 | 新发言自动追加并滚动到底部 |
| **manual-scroll** | 用户向上滚动查看历史 | 暂停自动滚动 + 右下角浮现"回到底部"按钮 |
| **long-transcript** | Transcript > 50 条 | 虚拟滚动或分页加载（GET /transcript?offset=） |

---

## 5. PanelistStatus → 视觉映射

| PanelistStatus | 视觉表现 | 说明 |
|----------------|----------|------|
| `STANDBY` | 标准卡片样式，透明度 0.7，无边框 | 当前未参与 |
| `PREPARING` | 卡片亮度提升至 0.85，边框微亮静态样式（嘉宾色 1px），无动画 | 被点名/举手，即将发言 |
| `SPEAKING` | 卡片完全不透明（opacity 1.0），嘉宾色边框 2px 高亮 + 背景微提亮（+10% 亮度），无脉冲动画 | 正在发言中 |

**重要约束：**
- STANDBY → PREPARING 过渡：150ms ease-out（亮度提升 + 边框出现）
- PREPARING → SPEAKING 过渡：200ms ease-out（边框加粗至 2px + 背景微提亮）
- SPEAKING → STANDBY 过渡：300ms ease-in（缓慢退场，不抢注意力）
- HOST 可直接 STANDBY → SPEAKING（主持开场场景）

---

## 6. 专家布局状态

| 专家数 | 桌面布局 (≥1024px) | 窄屏布局 (<1024px) |
|--------|---------------------|---------------------|
| 4 | 2×2 网格 | 2×2 网格 |
| 5 | 3+2 错行（上排 3，下排 2 居中） | 3+2 错行 或 2×3（占位留空） |
| 6 | 3×2 网格 | 2×3 网格 |
| 7 | 4+3 错行 | 2×4（最后一位居中） |
| 8 | 4×2 网格 | 2×4 网格 |

> 主持人在阵列上方单独一行，不参与专家网格。

---

## 7. 全局页面状态

| 状态 | 触发条件 | UI 表现 |
|------|----------|---------|
| **initial-loading** | 页面首次加载，GET /discussions/:id 请求中 | 全页 skeleton |
| **not-found** | GET /discussions/:id 返回 404 | "讨论不存在" + 返回首页链接 |
| **empty-list** | 首页 GET /discussions 返回空数组 | "暂无讨论"引导创建 |
| **api-error** | 任意 REST API 返回 500 | Toast + 重试按钮（非阻塞，不覆盖页面内容） |
