# AI Panel Studio

> AI 圆桌讨论 Web App · 虚拟智库 · 前端工程

## 运行指南

```bash
cd frontend
npm install
npm run dev        # 开发模式 (VITE_MOCK=true 使用 Mock 数据)
npm run build      # 生产构建
npm run test       # 运行测试
```

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `VITE_API_BASE` | `http://localhost:8000` | FastAPI 后端地址 |
| `VITE_WS_BASE` | `ws://localhost:8000` | WebSocket 后端地址 |
| `VITE_MOCK` | `true` | Mock 模式：无需后端，使用内置 Mock 数据和模拟 WebSocket |

**Mock 模式**（`VITE_MOCK=true`）下，所有 API 调用返回预设样例数据，WebSocket 事件由内置 `MockWsServer` 按预设脚本自动发射。可完整体验创建讨论 → 生成嘉宾 → 确认阵容 → 演播厅实时讨论 → 结束总结的全流程。

## 技术选型

| 层 | 技术 | 说明 |
|----|------|------|
| 框架 | Vue 3.5+ | Composition API + `<script setup>` |
| 语言 | TypeScript 5.5+ | strict mode |
| 构建 | Vite 5 | HMR 开发 + 生产构建 |
| 路由 | Vue Router 4 | history 模式 |
| 状态管理 | Pinia 2 | 3 个 Store 模块 |
| HTTP | Axios | 拦截器统一错误处理 |
| 图标 | Lucide Vue Next | SVG 图标 |
| 测试 | Vitest + Vue Test Utils + happy-dom | 单元 + 组件 |
| 样式 | CSS Variables | Design Token 体系 |

## 主要 API 列表

| 方法 | 端点 | 说明 |
|------|------|------|
| `GET` | `/api/discussions` | 列出所有讨论 |
| `POST` | `/api/discussions` | 创建讨论 |
| `GET` | `/api/discussions/:id` | 讨论详情 |
| `DELETE` | `/api/discussions/:id` | 删除讨论 |
| `POST` | `/api/discussions/:id/panel/generate` | 生成嘉宾阵容 |
| `POST` | `/api/discussions/:id/panel/regenerate` | 全部重新生成嘉宾 |
| `GET` | `/api/discussions/:id/panel` | 获取嘉宾列表 |
| `PUT` | `/api/discussions/:id/panel/:pid` | 替换单个专家 |
| `POST` | `/api/discussions/:id/start` | 开始讨论 |
| `POST` | `/api/discussions/:id/end` | 结束讨论 |
| `GET` | `/api/discussions/:id/transcript` | Transcript (分页) |
| `GET` | `/api/discussions/:id/consensus` | 共识与分歧 |
| `WS` | `/ws/discussions/:id` | 实时事件流 |

## 已完成能力

### 页面与流程

- [x] 首页：讨论列表 + 创建讨论（话题输入 + 4–8 位专家选择）
- [x] PENDING_PANEL：自动生成嘉宾阵容 · skeleton 加载 · 失败重试
- [x] PANEL_READY：嘉宾阵容展示 · 替换单个专家 · 全部重新生成 · 开始讨论
- [x] IN_PROGRESS 演播厅：舞台区 + 当前发言横幅 + 共识面板 + Transcript 面板
- [x] ENDED：主持人总结 + 共识/Transcript 完整回顾 + 删除讨论
- [x] WebSocket 状态三态指示器（已连接/重连中/已断开）
- [x] Mock WebSocket 完整演示流程（5 轮预设发言 + 共识提炼 + 结束总结）

### 组件与状态

- [x] DiscussionStatus 4 状态驱动子视图切换
- [x] PanelistStatus 3 态静态视觉（STANDBY opacity 0.7 / PREPARING opacity 0.85 边框微亮 / SPEAKING opacity 1.0 边框 2px 背景微提亮）
- [x] Toast 堆叠 ≤3 条 · 4 种 variant · 3s 自动消失
- [x] ConfirmDialog 二次确认 · Tab 循环焦点锁定 · Escape 关闭
- [x] ErrorOverlay 不可恢复错误全屏遮罩
- [x] Transcript 自动滚动 + 手动上滚暂停 + 回到底部按钮
- [x] 共识/分歧面板独立滚动

### 响应式与无障碍

- [x] 4 断点响应式（手机 <768px · 平板 768–1023px · 桌面 ≥1024px）
- [x] 平板端双栏自动切换 Tab 模式
- [x] 手机端 ExpertCard 紧凑模式
- [x] 专家网格 Arrow 键导航
- [x] aria-live 实时播报 · role="grid" · role="dialog" · role="log"
- [x] skip-link 跳过导航
- [x] prefers-reduced-motion 禁用动画
- [x] 对比度全部 ≥ 4.5:1 (WCAG AA)

### 工程

- [x] 60+ CSS Design Token 变量 · 10 色嘉宾身份色板 · 语义状态色严格分离
- [x] 暗色单主题 · 深蓝灰基调
- [x] Mock API 层（VITE_MOCK 动态切换）
- [x] 类型安全的 WS 事件判别联合 + sequence_id 去重
- [x] 7 测试套件 · 43 条测试（30 单元 + 13 组件）

## 工程结构

```
frontend/
├── src/
│   ├── types/          # TS 类型：enums · domain · api · websocket
│   ├── constants/      # 常量：panelist-colors · design-tokens
│   ├── styles/         # CSS：variables.css · reset.css
│   ├── router/         # Vue Router：/ + /discussions/:id
│   ├── api/            # REST Client：client · endpoints
│   ├── stores/         # Pinia：discussion-list · discussion · websocket
│   ├── composables/    # useToast · useMediaQuery
│   ├── mocks/          # Mock 数据 + API + WebSocket
│   ├── components/     # 32 个 Vue 组件
│   │   ├── shared/     # GlobalToast · ConfirmDialog · ErrorOverlay · LoadingSkeleton · ScrollToBottomButton
│   │   ├── home/       # DiscussionCreateCard · DiscussionList · DiscussionCard · TopicInput · ExpertCountSelector · EmptyState
│   │   ├── panel/      # PendingPanelView · PanelReadyView · PanelistGrid · HostCard · ExpertCard · PanelActions · PanelistSkeletonGrid
│   │   ├── studio/     # StudioView · StageArea · HostSpot · ExpertGrid · ExpertSpot · CurrentSpeechBanner
│   │   ├── transcript/ # TranscriptPanel · TranscriptMessage
│   │   ├── consensus/  # ConsensusPanel · ConsensusPointItem
│   │   ├── ended/      # EndedView · HostSummaryCard
│   │   └── layout/     # DiscussionTopBar · WsConnectionIndicator
│   └── views/          # HomePage · DiscussionPage
├── tests/
│   ├── unit/           # 4 文件 · 30 测试：enums · colors · tokens · store
│   └── components/     # 3 文件 · 13 测试：ExpertCard · ConfirmDialog · WsConnectionIndicator
└── dist/               # 生产构建产出
```

## 后续改进方向

- [ ] 后端实现（FastAPI + DeepSeek API + SQLite + 真实 WebSocket）
- [ ] E2E 测试（Playwright 覆盖 5 条核心 happy path）
- [ ] Transcript 虚拟滚动（当前简单 DOM 渲染可处理 <200 条消息）
- [ ] 录制/回放功能（已预留接口）
- [ ] 亮色主题（当前仅暗色，设计 Token 体系已预留扩展性）
- [ ] 国际化 i18n
- [ ] 更多组件测试和单元测试覆盖
