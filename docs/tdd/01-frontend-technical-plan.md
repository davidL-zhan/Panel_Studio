# 01 — Frontend Technical Plan

> TDD 阶段 · Vue 3 前端技术方案 · AI Panel Studio
>
> 基于 DDD v1.0 FROZEN · 2026-08-05

---

## 1. 技术栈

| 层 | 技术 | 版本 | 说明 |
|----|------|------|------|
| 框架 | Vue 3 | ^3.4 | Composition API + `<script setup>` |
| 语言 | TypeScript | ^5.5 | strict mode |
| 构建 | Vite | ^5 | 开发 HMR + 生产构建 |
| 路由 | Vue Router | ^4 | history 模式 |
| 状态管理 | Pinia | ^2 | 3 Store 模块 |
| HTTP | `fetch` + 封装 | 原生 | 轻量 REST client |
| WebSocket | 原生 `WebSocket` + 封装 | 原生 | 含重连/去重/心跳 |
| CSS | CSS Variables + PostCSS | — | Design Token 落地 |
| 图标 | lucide-vue-next | ^0.x | SVG 图标 |
| 虚拟滚动 | vue-virtual-scroller | ^2 | Transcript 面板 |
| 测试 | Vitest + Vue Test Utils + Playwright | — | 单元 → 组件 → E2E |
| Lint | ESLint + Prettier | — | 代码规范 |

---

## 2. 工程结构

```
panel-studio-frontend/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── .env.development          # VITE_API_BASE=http://localhost:8000
├── .env.mock                 # VITE_API_BASE=http://localhost:3001 (MSW)
│
├── public/
│   └── favicon.svg
│
├── src/
│   ├── main.ts               # createApp + router + pinia
│   ├── App.vue               # 根组件：AppTopBar + <router-view> + GlobalToast + ConfirmDialog
│   │
│   ├── types/                # TypeScript 类型定义
│   │   ├── domain.ts         # Discussion, Panelist, Message, ConsensusPoint
│   │   ├── enums.ts          # DiscussionStatus, PanelistStatus, MessageType, ConsensusType, PanelistRole
│   │   ├── api.ts            # REST 请求/响应 DTO
│   │   └── websocket.ts      # WS 事件联合类型 + 事件 schema
│   │
│   ├── constants/
│   │   ├── panelist-colors.ts # 10 色色板 + HOST_COLOR + 分配函数
│   │   └── design-tokens.ts  # 间距/字号/圆角常量（与 CSS 变量同步）
│   │
│   ├── api/
│   │   ├── client.ts         # fetch 封装：base URL, error handling, 请求/响应拦截
│   │   ├── discussions.ts    # REST API: discussions CRUD
│   │   ├── panel.ts          # REST API: panel generate/replace/regenerate
│   │   └── control.ts        # REST API: start/end discussion
│   │
│   ├── websocket/
│   │   ├── connection.ts     # WebSocket 连接管理：connect/disconnect/reconnect/heartbeat
│   │   ├── event-handler.ts  # 事件分发：解析 → 校验 sequence_id → 去重 → Store action
│   │   └── types.ts          # WS 事件枚举 + payload 类型
│   │
│   ├── stores/
│   │   ├── discussion-list.ts    # useDiscussionListStore — 首页列表
│   │   ├── discussion.ts         # useDiscussionStore — 当前讨论（含 panelists/messages/consensus）
│   │   └── websocket.ts          # useWebSocketStore — WS 状态 + lastSequenceId
│   │
│   ├── composables/
│   │   ├── useAutoScroll.ts      # Transcript 自动滚动逻辑
│   │   ├── useVirtualScroll.ts   # 虚拟滚动配置
│   │   ├── useMediaQuery.ts      # 响应式断点检测
│   │   └── useReducedMotion.ts   # prefers-reduced-motion 检测
│   │
│   ├── router/
│   │   └── index.ts              # 路由定义：/ + /discussions/:id
│   │
│   ├── views/
│   │   ├── HomePage.vue          # 首页：讨论列表 + 创建
│   │   └── DiscussionPage.vue    # 讨论详情容器（状态驱动子视图切换）
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppTopBar.vue
│   │   │   ├── DiscussionTopBar.vue
│   │   │   └── WsConnectionIndicator.vue
│   │   │
│   │   ├── home/
│   │   │   ├── DiscussionCreateCard.vue
│   │   │   ├── TopicInput.vue
│   │   │   ├── ExpertCountSelector.vue
│   │   │   ├── DiscussionList.vue
│   │   │   ├── DiscussionCard.vue
│   │   │   └── EmptyState.vue
│   │   │
│   │   ├── panel/
│   │   │   ├── PanelistSkeletonGrid.vue
│   │   │   ├── PanelReadyView.vue
│   │   │   ├── PanelActions.vue
│   │   │   ├── PanelistGrid.vue
│   │   │   ├── HostCard.vue
│   │   │   └── ExpertCard.vue
│   │   │
│   │   ├── studio/
│   │   │   ├── StudioView.vue
│   │   │   ├── StageArea.vue
│   │   │   ├── HostSpot.vue
│   │   │   ├── ExpertGrid.vue
│   │   │   ├── ExpertSpot.vue
│   │   │   └── CurrentSpeechBanner.vue
│   │   │
│   │   ├── transcript/
│   │   │   ├── TranscriptPanel.vue
│   │   │   ├── TranscriptMessage.vue
│   │   │   └── ScrollToBottomButton.vue
│   │   │
│   │   ├── consensus/
│   │   │   ├── ConsensusPanel.vue
│   │   │   └── ConsensusPointItem.vue
│   │   │
│   │   ├── ended/
│   │   │   ├── EndedView.vue
│   │   │   └── HostSummaryCard.vue
│   │   │
│   │   └── shared/
│   │       ├── GlobalToast.vue
│   │       ├── ConfirmDialog.vue
│   │       ├── ErrorOverlay.vue
│   │       ├── LoadingSkeleton.vue
│   │       └── ScrollToBottomButton.vue
│   │
│   └── styles/
│       ├── variables.css       # CSS 自定义属性（Design Token 落地）
│       ├── reset.css           # 全局 reset + 暗色基线
│       ├── utilities.css       # 通用工具类
│       └── animations.css      # 全局动画 keyframes（入场/淡出/高亮）
│
├── tests/
│   ├── unit/                   # Vitest 单元测试
│   │   ├── types/
│   │   ├── api/
│   │   ├── websocket/
│   │   └── stores/
│   ├── components/             # Vue Test Utils 组件测试
│   └── e2e/                    # Playwright E2E
│       ├── home.spec.ts
│       ├── create-discussion.spec.ts
│       ├── panel-generation.spec.ts
│       ├── studio-live.spec.ts
│       └── end-discussion.spec.ts
│
└── mocks/
    ├── handlers.ts             # MSW request handlers（Mock API）
    ├── server.ts               # MSW server setup（单元/组件测试用）
    └── fixtures/               # 测试数据
        ├── discussions.json
        ├── panelists.json
        └── messages.json
```

---

## 3. 领域类型定义

### 3.1 枚举（`src/types/enums.ts`）

```typescript
// SDD §01-domain-model
export enum DiscussionStatus {
  PENDING_PANEL = 'PENDING_PANEL',
  PANEL_READY   = 'PANEL_READY',
  IN_PROGRESS   = 'IN_PROGRESS',
  ENDED         = 'ENDED',
}

export enum PanelistRole {
  HOST   = 'HOST',
  EXPERT = 'EXPERT',
}

export enum PanelistStatus {
  STANDBY   = 'STANDBY',
  PREPARING = 'PREPARING',
  SPEAKING  = 'SPEAKING',
}

export enum MessageType {
  OPENING    = 'OPENING',
  QUESTION   = 'QUESTION',
  ANSWER     = 'ANSWER',
  SUPPLEMENT = 'SUPPLEMENT',
  REBUTTAL   = 'REBUTTAL',
  TRANSITION = 'TRANSITION',
  SUMMARY    = 'SUMMARY',
}

export enum ConsensusType {
  CONSENSUS     = 'CONSENSUS',
  DISAGREEMENT  = 'DISAGREEMENT',
}
```

### 3.2 领域实体（`src/types/domain.ts`）

```typescript
export interface Discussion {
  id: string
  topic: string
  expert_count: number  // 4–8
  status: DiscussionStatus
  created_at: string    // ISO 8601
  updated_at: string
}

export interface Panelist {
  id: string
  discussion_id: string
  name: string
  role: PanelistRole
  profession: string
  title: string
  stance: string
  color: string         // e.g. "#FF6B6B"
  status: PanelistStatus
  current_focus: string | null
  sort_order: number
}

export interface Message {
  id: string
  discussion_id: string
  panelist_id: string
  panelist_name: string       // JOIN 衍生字段
  panelist_title: string      // JOIN 衍生字段
  panelist_color: string      // JOIN 衍生字段
  content: string
  message_type: MessageType
  sequence: number
  created_at: string
}

export interface ConsensusPoint {
  id: string
  discussion_id: string
  point_type: ConsensusType
  content: string
  message_range_start: number | null
  message_range_end: number | null
  generated_at: string
}
```

### 3.3 WebSocket 事件联合类型（`src/types/websocket.ts`）

```typescript
export type WsEventType =
  | 'initial_state'
  | 'discussion_started'
  | 'panel_generated'
  | 'panelist_status'
  | 'new_message'
  | 'consensus_update'
  | 'discussion_ended'
  | 'discussion_deleted'
  | 'error'

export interface WsEnvelope {
  event: WsEventType
  sequence_id: number
  data: WsEventPayload
  timestamp: string
}

// 判别联合（discriminated union）
export type WsEventPayload =
  | { type: 'initial_state'; discussion_status: DiscussionStatus; latest_messages: Message[]; consensus_points: ConsensusPoint[]; panelists: Panelist[] }
  | { type: 'discussion_started'; topic: string; panelist_count: number }
  | { type: 'panel_generated'; host: Panelist; experts: Panelist[] }
  | { type: 'panelist_status'; panelists: Array<{ id: string; status: PanelistStatus; current_focus: string | null }> }
  | { type: 'new_message'; message: Message }
  | { type: 'consensus_update'; points: ConsensusPoint[] }
  | { type: 'discussion_ended'; summary: string; total_messages: number }
  | { type: 'discussion_deleted'; discussion_id: string }
  | { type: 'error'; message: string; recoverable: boolean }
```

---

## 4. REST API Client 职责边界

### 4.1 封装层 (`src/api/client.ts`)

```typescript
// 职责：base URL 拼接、JSON 序列化/反序列化、统一错误处理、超时
const BASE_URL = import.meta.env.VITE_API_BASE   // .env 注入

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),  // 15s 超时
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new ApiError(res.status, err.detail, res)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}
```

**职责边界：**
- API Client 只负责 HTTP 传输和错误分类
- **不**持有状态、**不**触发 Store 更新、**不**显示 Toast
- 调用方（Store actions）负责：调用 API → 更新 Store → 触发 Toast（通过 composable）

---

## 5. WebSocket Client 职责边界

### 5.1 连接管理 (`src/websocket/connection.ts`)

```typescript
class WsConnection {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 3
  private reconnectDelays = [1000, 2000, 4000]  // 1s / 2s / 4s 指数退避
  private heartbeatInterval: number | null = null
  private lastSequenceId = 0

  connect(discussionId: string, lastSeq?: number): void
  disconnect(): void
  send(message: object): void
}
```

**重连策略：**
1. 检测断开 → 等待 `reconnectDelays[attempt]`
2. 重连 URL 携带 `?last_seq={n}`
3. 服务端重放 `sequence_id > n` 的事件
4. 3 次失败 → 标记 `disconnected`，停止重连
5. 重连成功 → 重置 `reconnectAttempts = 0`

**心跳机制：**
```typescript
// 客户端每 15s 发送 ping，包含 lastSequenceId
setInterval(() => {
  this.send({ type: 'ping', last_seq: this.lastSequenceId })
}, 15000)

// 服务端 pong 返回 server_seq，客户端据此检测遗漏
onPong(serverSeq: number) {
  if (serverSeq - this.lastSequenceId > 200) {
    // 严重落后，请求 initial_state 全量刷新
  }
}
```

### 5.2 事件去重与遗漏检测 (`src/websocket/event-handler.ts`)

```typescript
function processEvent(envelope: WsEnvelope, store: ReturnType<typeof useDiscussionStore>): void {
  // 去重
  if (envelope.sequence_id <= store.lastSequenceId) {
    console.debug(`[WS] 重复事件 seq=${envelope.sequence_id}，已跳过`)
    return
  }

  // 遗漏检测
  if (envelope.sequence_id > store.lastSequenceId + 1) {
    const missed = envelope.sequence_id - store.lastSequenceId - 1
    store.missedEventCount += missed
    console.warn(`[WS] 遗漏 ${missed} 个事件 (seq ${store.lastSequenceId + 1}–${envelope.sequence_id - 1})`)
  }

  store.lastSequenceId = envelope.sequence_id

  // 事件分发
  dispatch(envelope.event, envelope.data, store)
}
```

**职责边界：**
- WebSocket Client 只负责：连接管理、序列号校验、心跳、安全分发到 Store
- **不**操作 DOM、**不**管理路由、**不**显示 UI 通知
- Store 负责接收事件数据并响应式更新状态
- 组件通过 `storeToRefs()` 读取状态并渲染

---

## 6. Mock API 与真实后端切换

### 6.1 方案：环境变量切换

```typescript
// vite.config.ts — 通过 VITE_MOCK 环境变量控制
export default defineConfig(({ mode }) => ({
  // ...
  envDir: '.',
}))

// .env.development  — 真实后端
VITE_API_BASE=http://localhost:8000
VITE_WS_BASE=ws://localhost:8000
VITE_MOCK=false

// .env.mock         — Mock 模式
VITE_API_BASE=http://localhost:3001
VITE_WS_BASE=ws://localhost:3001
VITE_MOCK=true
```

### 6.2 Mock 实现：MSW (Mock Service Worker)

```
mocks/
├── handlers.ts    # REST 处理器
├── server.ts      # 测试用 server
└── fixtures/      # 静态测试数据 + WS 事件模拟器
```

```typescript
// mocks/handlers.ts 示例
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('*/api/discussions', () => {
    return HttpResponse.json(mockDiscussions)
  }),
  http.post('*/api/discussions/:id/start', ({ params }) => {
    return HttpResponse.json({ status: 'IN_PROGRESS', message: '...' })
  }),
  // ... 覆盖所有 13 个 REST 端点
]
```

### 6.3 WS Mock：内存事件模拟器

```typescript
// tests/ 中使用本地 event emitter 模拟 WebSocket
class MockWsServer {
  private listeners: Map<string, (data: WsEnvelope) => void>

  emit(event: WsEventType, data: WsEventPayload): void { /* ... */ }
  simulateDiscussion(transcript: Message[]): void { /* 按时间间隔发射事件 */ }
}
```

**切换方式：**
- 开发联调：`vite --mode development` → 连真实 FastAPI 后端
- 前端独立开发：`vite --mode mock` → MSW 拦截 + MockWsServer
- 组件测试：MSW server + MockWsServer，无需真实后端
- E2E 测试：两种模式各一份 suite

---

## 7. Design Token 落地

### 7.1 策略：CSS Variables + TypeScript 常量双向同步

```css
/* src/styles/variables.css */
:root {
  /* === 颜色 === */
  --bg-root:           #0B0B14;
  --bg-surface-1:       #111122;
  --bg-surface-2:       #16162B;
  --bg-surface-3:       #1C1C38;
  --text-primary:       #F1F1F7;
  --text-secondary:     #9494A8;
  --text-tertiary:      #5C5C78;
  --border-default:     #28284D;
  --border-subtle:      #1E1E3A;
  --border-focus:       #4E4E8A;

  /* 语义状态色 */
  --color-success:      #22C55E;
  --color-warning:      #F59E0B;
  --color-error:        #EF4444;
  --color-info:         #3B82F6;

  /* 共识/分歧 */
  --color-consensus:    #22C55E;
  --color-disagreement: #F59E0B;

  /* 嘉宾色板 */
  --color-panelist-0: #FF6B6B;
  --color-panelist-1: #4ECDC4;  /* 主持人专用 */
  --color-panelist-2: #45B7D1;
  --color-panelist-3: #96CEB4;
  --color-panelist-4: #FFEAA7;
  --color-panelist-5: #DDA0DD;
  --color-panelist-6: #98D8C8;
  --color-panelist-7: #F7DC6F;
  --color-panelist-8: #E17055;
  --color-panelist-9: #6C5CE7;

  /* === 间距 === */
  --space-xs:   4px;
  --space-sm:   8px;
  --space-md:  16px;
  --space-lg:  24px;
  --space-xl:  32px;
  --space-2xl: 48px;
  --space-3xl: 64px;

  /* === 字号 === */
  --text-xs:   12px;
  --text-sm:   14px;
  --text-base: 16px;
  --text-lg:   18px;
  --text-xl:   24px;
  --text-2xl:  32px;
  --text-3xl:  40px;

  /* === 圆角 === */
  --radius-sm:   4px;
  --radius-md:   8px;
  --radius-lg:  12px;
  --radius-xl:  16px;
  --radius-full: 9999px;

  /* === 阴影（暗色主题）=== */
  --shadow-sm:   0 1px 3px  rgba(0,0,0,0.4);
  --shadow-md:   0 4px 12px rgba(0,0,0,0.5);
  --shadow-lg:   0 8px 24px rgba(0,0,0,0.6);
  --shadow-glow: 0 0 20px rgba(78,205,196,0.15);
}
```

```typescript
// src/constants/design-tokens.ts — 与 CSS 变量同步（用于动态 style 绑定）
export const PANELIST_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#E17055', '#6C5CE7',
] as const

export const HOST_COLOR = PANELIST_COLORS[1]  // #4ECDC4
```

### 7.2 组件中使用

```vue
<!-- 方式 1：CSS 类 + data 属性 -->
<div class="panelist-card" :data-status="panelist.status"
     :style="{ '--panelist-color': panelist.color }">
</div>

<!-- 方式 2：动态 inline style（仅颜色）-->
<div :style="{ borderColor: isSpeaking ? panelist.color : 'var(--border-subtle)' }">
</div>
```

**原则：间距/字号/圆角只通过 CSS 类引用变量，不写 inline style。颜色通过 CSS 变量动态注入。**

---

## 8. Transcript 虚拟滚动

### 8.1 方案：vue-virtual-scroller

```vue
<template>
  <DynamicScroller
    :items="messages"
    :min-item-size="72"
    class="transcript-scroller"
    ref="scrollerRef"
  >
    <template #default="{ item, index, active }">
      <DynamicScrollerItem :item="item" :active="active" :size-dependencies="[item.content]">
        <TranscriptMessage :message="item" :is-latest="index === messages.length - 1" />
      </DynamicScrollerItem>
    </template>
  </DynamicScroller>
</template>
```

**关键参数：**
- `min-item-size`: 72px（单条消息最小高度，含 padding）
- `size-dependencies`: `[item.content]`（内容变化时重新计算高度）
- 自动滚动到最新：`scrollerRef.scrollToItem(messages.length - 1)`
- 手动查看历史时：暂停 auto-scroll，显示 ScrollToBottomButton

### 8.2 降级方案

若 `vue-virtual-scroller` 与 Vue 3.4 兼容性问题，自建简化版：

```typescript
// composables/useVirtualScroll.ts
function useVirtualScroll(items: Ref<Message[]>, containerHeight: number, itemHeight: number) {
  const startIndex = ref(0)
  const endIndex = ref(0)
  // 计算可视区起止索引 + 上下 5 条缓冲区
  // 返回 { visibleItems, totalHeight, offsetY }
}
```

---

## 9. 响应式设计与无障碍实现策略

### 9.1 响应式断点检测

```typescript
// composables/useMediaQuery.ts
export function useMediaQuery() {
  const isMobile  = useMediaQuery('(max-width: 767px)')
  const isTablet  = useMediaQuery('(min-width: 768px) and (max-width: 1023px)')
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  return { isMobile, isTablet, isDesktop }
}
```

**布局切换策略：**
- 专家网格：CSS Grid `grid-template-columns: repeat(auto-fill, minmax(180px, 1fr))` 自然换行
- 平板 Tab 切换：`isTablet` 驱动 `v-if` 切换双栏/Tab 模式
- 手机收起：`isMobile` 驱动 `ExpertSpot` 的紧凑模式

### 9.2 无障碍实现

- **键盘导航**：嘉宾网格 `role="grid"` + `Arrow 键` 导航
- **ARIA 标注**：`aria-live="polite"` 播报新发言；`role="alert"` 播报错误
- **Focus 管理**：`:focus-visible` 轮廓 + Dialog 焦点锁定
- **reduced-motion**：`prefers-reduced-motion` 媒体查询全局禁用动画
- **多重编码**：颜色 + 图标 + 文字（`aria-label` 或 `sr-only`）

---

## 10. 测试策略

### 10.1 测试金字塔

```
        ┌──────┐
        │ E2E  │  Playwright · 5 条 happy path
       ┌┴──────┴┐
       │  组件   │  Vue Test Utils · 每个核心组件至少 2 条
      ┌┴────────┴┐
      │   单元    │  Vitest · types/api/ws/stores 全覆盖
     └───────────┘
```

### 10.2 单元测试范围

| 目标 | 工具 | 说明 |
|------|------|------|
| `types/` 枚举 & 类型守卫 | Vitest | 枚举值校验、WS 事件判别联合 |
| `api/client.ts` | Vitest + MSW | 200/201/204/404/409/422/500 各至少 1 条 |
| `websocket/event-handler.ts` | Vitest + mock WS | 正常/重复/遗漏/乱序 4 场景 |
| `websocket/connection.ts` | Vitest + fake timers | 重连 1s/2s/4s 退避 + 3 次失败 |
| `stores/discussion.ts` | Vitest + MSW | 状态驱动：PENDING→PANEL_READY→IN_PROGRESS→ENDED |
| `constants/panelist-colors.ts` | Vitest | 10 色唯一性 + HOST_COLOR 正确 |
| `composables/` | Vitest | 自动滚动/虚拟滚动/断点检测/reduced-motion |

### 10.3 组件测试范围

| 组件 | 最小覆盖 |
|------|----------|
| `DiscussionCreateCard` | 输入校验 + 创建成功/失败 |
| `ExpertCard` | STANDBY/PREPARING/SPEAKING 三种样式 |
| `CurrentSpeechBanner` | 新消息更新 + 动画 |
| `TranscriptPanel` | 自动滚动/手动浏览/新消息追加 |
| `ConsensusPanel` | 空列表/有数据/更新高亮 |
| `WsConnectionIndicator` | 3 态切换 |
| `ConfirmDialog` | 打开/确认/取消/Escape 关闭 |
| `GlobalToast` | 堆叠 ≤3 + 自动消失 |

### 10.4 E2E 测试范围

| # | 用例 | 对应流程 |
|---|------|----------|
| E2E-01 | 首页 → 创建讨论 → 嘉宾生成 → 确认阵容 | `03-user-flow.md` §1–5 |
| E2E-02 | 开始讨论 → 观看实时发言 → 共识更新 → 结束讨论 | `03-user-flow.md` §6–7 |
| E2E-03 | 替换专家 → 开始讨论（验证替换生效） | `03-user-flow.md` §3 |
| E2E-04 | WS 断线 → 重连 → 事件追赶 | `03-user-flow.md` §9 |
| E2E-05 | 删除讨论 → 返回首页 | `03-user-flow.md` §8 |
