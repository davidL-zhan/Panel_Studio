# 07 — Component Architecture

> DDD 阶段 · Vue 3 组件树 · AI Panel Studio

---

## 1. 组件树总览

```
App.vue
├── AppTopBar.vue                    (全局顶栏 — 仅首页显示完整，其他页显示返回+标题)
├── <router-view>
│   ├── HomePage.vue                 (首页)
│   │   ├── DiscussionCreateCard.vue (话题输入 + 人数选择)
│   │   │   ├── TopicInput.vue
│   │   │   └── ExpertCountSelector.vue
│   │   ├── DiscussionList.vue       (讨论列表)
│   │   │   └── DiscussionCard.vue   (单个讨论卡片) ×N
│   │   └── EmptyState.vue           (空列表引导)
│   │
│   └── DiscussionPage.vue           (讨论详情 — 状态驱动路由容器)
│       ├── DiscussionTopBar.vue     (返回 + 标题 + 状态指示器)
│       │   └── WsConnectionIndicator.vue
│       ├── PendingPanelView.vue     (status === PENDING_PANEL)
│       │   └── PanelistSkeletonGrid.vue
│       ├── PanelReadyView.vue       (status === PANEL_READY)
│       │   ├── PanelistGrid.vue
│       │   │   ├── HostCard.vue     (主持人卡片)
│       │   │   └── ExpertCard.vue   (专家卡片) ×N
│       │   └── PanelActions.vue     (开始/重新生成按钮)
│       ├── StudioView.vue           (status === IN_PROGRESS)
│       │   ├── StageArea.vue        (舞台区域 — 固定高度)
│       │   │   ├── HostSpot.vue     (主持人位置)
│       │   │   ├── ExpertGrid.vue   (专家阵列)
│       │   │   │   └── ExpertSpot.vue (单个专家小窗) ×N
│       │   │   └── CurrentSpeechBanner.vue (当前发言横幅)
│       │   ├── ConsensusPanel.vue   (共识/分歧面板 — 独立滚动)
│       │   │   └── ConsensusPointItem.vue ×N
│       │   ├── TranscriptPanel.vue  (Transcript 面板 — 独立滚动)
│       │   │   └── TranscriptMessage.vue ×N
│       │   └── ScrollToBottomButton.vue
│       └── EndedView.vue            (status === ENDED)
│           ├── HostSummaryCard.vue   (主持人总结)
│           ├── ConsensusPanel.vue    (复用)
│           └── TranscriptPanel.vue   (复用，可分页)
│
├── GlobalToast.vue                  (全局 Toast 容器)
├── ConfirmDialog.vue                (全局二次确认对话框)
└── ErrorOverlay.vue                 (全局不可恢复错误遮罩)
```

---

## 2. 核心组件定义

### 2.1 `DiscussionPage.vue`

| 维度 | 详情 |
|------|------|
| **职责** | 根据 `discussion.status` 路由到对应子视图；管理讨论数据的获取与轮询/WS 生命周期 |
| **Props** | — (从 `route.params.id` 获取 discussion_id) |
| **Store** | `useDiscussionStore` — 持有当前 discussion、panelists、messages、consensusPoints |
| **API** | `GET /api/discussions/:id`（初始加载） |
| **WS** | 仅在 status === IN_PROGRESS 时建立 WS 连接 |
| **Loading** | 全页 skeleton |
| **Empty** | 不适用（404 由路由守卫处理） |
| **Error** | 404 → ErrorOverlay；500 → Toast + 重试 |

### 2.2 `DiscussionCreateCard.vue`

| 维度 | 详情 |
|------|------|
| **职责** | 话题输入 + 专家人数选择 + 创建讨论 |
| **Props** | — |
| **Emits** | `@created(discussionId: string)` |
| **Store** | `useDiscussionListStore` |
| **API** | `POST /api/discussions` |
| **Loading** | 按钮变 loading |
| **Empty** | — |
| **Error** | 422 → 字段级错误；500 → Toast |

### 2.3 `PanelistGrid.vue` / `ExpertGrid.vue`

| 维度 | 详情 |
|------|------|
| **职责** | 以网格布局渲染 4–8 位专家卡片；响应 `panelist_status` WS 事件切换视觉状态 |
| **Props** | `panelists: Panelist[]`, `discussionStatus: DiscussionStatus` |
| **Store** | 直接从 `useDiscussionStore.panelists` 读取 |
| **WS 事件** | `panelist_status` → 更新每位专家的 status 和 current_focus |
| **Loading** | 显示 `PanelistSkeletonGrid` |
| **Empty** | 不适用 |
| **Error** | — |

### 2.4 `ExpertSpot.vue`

| 维度 | 详情 |
|------|------|
| **职责** | 单个专家小窗：显示头像色块、姓名、职业、STANDBY/PREPARING/SPEAKING 状态、公开思考摘要 |
| **Props** | `panelist: Panelist`, `isSpeaking: boolean`, `isPreparing: boolean` |
| **视觉映射** | `STANDBY` → opacity 0.7；`PREPARING` → opacity 0.85 + 边框微亮静态（嘉宾色 1px）；`SPEAKING` → opacity 1.0 + 边框高亮 2px + 背景微提亮 +10% |
| **颜色** | `--panelist-color` CSS 变量由 props.panelist.color 动态设置 |

### 2.5 `CurrentSpeechBanner.vue`

| 维度 | 详情 |
|------|------|
| **职责** | 展示当前发言人的姓名、头衔和发言内容（大字号），每次新发言介入时 fade + slide 动画 |
| **Props** | `message: Message | null` |
| **WS 事件** | `new_message` → 更新内容 |
| **Loading** | 初始状态显示"等待开场..." |
| **Empty** | 同上 |
| **Error** | — |

### 2.6 `TranscriptPanel.vue`

| 维度 | 详情 |
|------|------|
| **职责** | 显示完整发言记录列表，独立滚动；支持自动追随最新 + 用户手动浏览历史 |
| **Props** | `discussionId: string`, `status: DiscussionStatus` |
| **Store** | `useDiscussionStore.messages` |
| **API** | `GET /api/discussions/:id/transcript?offset=&limit=`（ENDED 态分页加载历史） |
| **WS 事件** | `new_message` → 追加到列表末尾 + 自动滚动 |
| **Loading** | skeleton 占位 |
| **Empty** | "暂无发言记录" |
| **自动滚动** | 用户在底部 → 自动追随；向上滚动 > 50px → 暂停 + 显示 ScrollToBottomButton |
| **虚拟滚动** | 使用 `vue-virtual-scroller` 或自建虚拟列表，仅渲染可视区 ± 5 条消息 |

### 2.7 `ConsensusPanel.vue`

| 维度 | 详情 |
|------|------|
| **职责** | 显示共识与分歧列表，独立滚动；新条目高亮动画 |
| **Props** | `discussionId: string` |
| **Store** | `useDiscussionStore.consensusPoints` |
| **API** | `GET /api/discussions/:id/consensus`（初始加载） |
| **WS 事件** | `consensus_update` → 全量替换（diff + 动画） |
| **Loading** | skeleton 占位 |
| **Empty** | "尚无共识与分歧" |

### 2.8 `WsConnectionIndicator.vue`

| 维度 | 详情 |
|------|------|
| **职责** | 显示 WS 连接状态：已连接（绿）、重连中（黄闪烁）、已断开（红） |
| **Props** | — |
| **Store** | `useWebSocketStore` — `status: 'connecting' | 'connected' | 'reconnecting' | 'disconnected'` |
| **三种状态** | 绿圆点 + "已连接" / 黄闪烁圆点 + "重连中..." / 红圆点 + "已断开" |

### 2.9 `ConfirmDialog.vue`

| 维度 | 详情 |
|------|------|
| **职责** | 全局二次确认对话框（删除讨论、结束讨论、全部重新生成） |
| **Props** | `open: boolean`, `title: string`, `message: string`, `confirmLabel: string`, `variant: 'danger' | 'default'` |
| **Emits** | `@confirm`, `@cancel` |
| **Focus** | 打开时焦点锁定在取消按钮，Tab 循环锁定在 Dialog 内 |

---

## 3. Pinia Store 设计

### 3.1 `useDiscussionListStore`

```typescript
// 首页讨论列表
interface DiscussionListState {
  discussions: DiscussionSummary[]
  loading: boolean
  error: string | null
}
```

### 3.2 `useDiscussionStore`

```typescript
// 当前打开的讨论（单例，由 DiscussionPage 初始化）
interface DiscussionState {
  discussion: Discussion | null
  panelists: Panelist[]
  messages: Message[]
  consensusPoints: ConsensusPoint[]
  loading: boolean
  error: string | null
}
```

### 3.3 `useWebSocketStore`

```typescript
// WebSocket 连接状态（全局单例，讨论级管理）
interface WebSocketState {
  status: 'disconnected' | 'connecting' | 'connected' | 'reconnecting'
  lastSequenceId: number
  missedEventCount: number
}
```

---

## 4. 组件通信规则

| 方向 | 方式 |
|------|------|
| Store → 组件 | `storeToRefs()` 响应式读取 |
| 组件 → Store | Store actions（`startDiscussion()`, `endDiscussion()` 等） |
| 父 → 子 | Props（无副作用纯展示数据） |
| 子 → 父 | Emits（用户交互事件） |
| 跨视图 | Pinia Store（不通过 props drilling 跨层级传递） |

---

## 5. 避免的反模式

| ❌ 避免 | ✅ 替代 |
|---------|--------|
| 单个超大型 `DiscussionView.vue`（> 500 行） | 拆分为状态驱动的子视图（PendingPanelView / PanelReadyView / StudioView / EndedView） |
| 组件内直接调用 `fetch()` | 所有 API 调用通过 Store actions |
| 在子组件中管理 WS 连接 | WS 生命周期在 DiscussionPage 中统一管理，Store 分发事件 |
| Props drilling 超过 3 层 | 使用 Pinia Store 或 provide/inject |
| 组件中硬编码颜色值 | 全部使用 CSS 变量或 props 传入 |
