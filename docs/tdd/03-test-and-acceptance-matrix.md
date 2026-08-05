# 03 — Test & Acceptance Matrix

> TDD 阶段 · 测试与验收矩阵 · AI Panel Studio 前端

---

## 1. 测试策略总览

| 层级 | 工具 | 数量 | 覆盖目标 |
|------|------|------|----------|
| 单元测试 | Vitest + MSW | ≥ 45 条 | types/api/ws/stores/composables 全覆盖 |
| 组件测试 | Vue Test Utils + MSW + MockWsServer | ≥ 22 条 | 每个核心组件 ≥ 2 场景 |
| E2E 测试 | Playwright | ≥ 7 条 | 5 happy path + 2 error path |

---

## 2. 单元测试矩阵

### 2.1 类型与常量（Vitest，无外部依赖）

| ID | 测试目标 | 测试用例 | 对应 DDD |
|----|----------|----------|----------|
| UT-01 | `DiscussionStatus` 枚举 | 4 个枚举值存在；字符串值与 SDD 一致 | `01-domain-model.md` §1.1 |
| UT-02 | `PanelistStatus` 枚举 | 3 个枚举值；字符串值一致 | `01-domain-model.md` §1.2 |
| UT-03 | `MessageType` 枚举 | 7 个枚举值含 SUMMARY | `01-domain-model.md` §1.3 |
| UT-04 | `WsEventPayload` 判别联合 | 每个 event type → 正确的 type narrowing | `02-api-contract.md` §3.2 |
| UT-05 | `panelist-colors.ts` | 10 色唯一性；HOST_COLOR = `#4ECDC4`；分配函数 4/8 专家不越界 | `04-llm-protocol.md` §3.5 |
| UT-06 | `design-tokens.ts` | 导出常量与 `variables.css` 对应值一致 | `05-design-system.md` §1 |

### 2.2 API Client（Vitest + MSW）

| ID | 测试目标 | 测试用例 | 对应 DDD |
|----|----------|----------|----------|
| UT-07 | `GET /api/discussions` | 200 返回列表；空列表 [] | `02-api-contract.md` §2.1 |
| UT-08 | `POST /api/discussions` | 201 返回创建结果；422 topic 过短过长；默认 expert_count=4 | `02-api-contract.md` §2.1 |
| UT-09 | `GET /api/discussions/:id` | 200 含 panelists/messages/consensus；404 不存在 | `02-api-contract.md` §2.1 |
| UT-10 | `DELETE /api/discussions/:id` | 204 删除成功；404 不存在 | `02-api-contract.md` §2.1 |
| UT-11 | `POST /panel/generate` | 200 host + experts；409 PANEL_READY 状态不可生成；502 LLM 错误 | `02-api-contract.md` §2.2 |
| UT-12 | `PUT /panel/:pid` | 200 替换成功（空 body）；400 替换 HOST；409 非 PANEL_READY | `02-api-contract.md` §2.2 |
| UT-13 | `POST /panel/regenerate` | 200 全新阵容；409 非 PANEL_READY | `02-api-contract.md` §2.2 |
| UT-14 | `POST /start` | 200 status=IN_PROGRESS；409 非 PANEL_READY | `02-api-contract.md` §2.3 |
| UT-15 | `POST /end` | 200 含 summary；幂等：已 ENDED 再调 → 200 | `02-api-contract.md` §2.3 |
| UT-16 | `GET /transcript` | 200 分页 offset/limit；空列表 [] | `02-api-contract.md` §2.4 |
| UT-17 | `GET /consensus` | 200 列表；空列表 [] | `02-api-contract.md` §2.4 |

### 2.3 WebSocket Client（Vitest + fake timers）

| ID | 测试目标 | 测试用例 | 对应 DDD |
|----|----------|----------|----------|
| UT-18 | 正常连接与事件接收 | connect → 收到 `initial_state` → 收到 `new_message` | `02-api-contract.md` §3.2 |
| UT-19 | sequence_id 去重 | 收到 seq=5 → lastSeqId=5；再次收到 seq=5 → 跳过 | `02-api-contract.md` §3.2 |
| UT-20 | sequence_id 遗漏检测 | lastSeqId=3 → 收到 seq=6 → missedCount += 2 | `02-api-contract.md` §3.2 |
| UT-21 | 重连 1s/2s/4s 退避 | fake timers: 断开 → 1s 后重连 → 失败 → 2s 后重连 → 失败 → 4s 后重连 | `08-interaction-specification.md` §3.2 |
| UT-22 | 3 次重连失败 | 3 次均失败 → status='disconnected'，停止重连 | `08-interaction-specification.md` §3.2 |
| UT-23 | 重连携带 last_seq | 重连 URL 包含 `?last_seq=42` | `02-api-contract.md` §3.2 |
| UT-24 | 心跳 15s 发送 ping | fake timers advance 15s → ping 已发送 | `01-frontend-technical-plan.md` §5 |
| UT-25 | pong 严重落后检测 | server_seq - lastSeqId > 200 → 请求 initial_state | `01-frontend-technical-plan.md` §5 |

### 2.4 Store（Vitest + MSW + MockWsServer）

| ID | 测试目标 | 测试用例 | 对应 DDD |
|----|----------|----------|----------|
| UT-26 | DiscussionListStore.fetchList | 200 → discussions 填充；500 → error 设置 | `07-component-architecture.md` §3.1 |
| UT-27 | DiscussionListStore.create | 201 → 路由到 `/discussions/:id`；422 → error | `07-component-architecture.md` §3.1 |
| UT-28 | DiscussionStore.fetchDiscussion | 200 → discussion/panelists/messages/consensus 全部填充 | `07-component-architecture.md` §3.2 |
| UT-29 | DiscussionStore.generatePanel | 200 → panelists 更新 + status → PANEL_READY | `04-page-state-matrix.md` §2 |
| UT-30 | DiscussionStore.start | 200 → status → IN_PROGRESS | `04-page-state-matrix.md` §4 |
| UT-31 | DiscussionStore.end | 200 → status → ENDED + summary | `04-page-state-matrix.md` §4 |
| UT-32 | DiscussionStore.handleNewMessage | WS `new_message` → messages 追加 + sequence 校验 | `07-component-architecture.md` §3.2 |
| UT-33 | DiscussionStore.handlePanelistStatus | WS `panelist_status` → panelists 状态更新 | `07-component-architecture.md` §3.2 |
| UT-34 | DiscussionStore.handleConsensusUpdate | WS `consensus_update` → consensusPoints 全量替换 | `07-component-architecture.md` §3.2 |
| UT-35 | WebSocketStore 状态流转 | disconnected→connecting→connected→reconnecting→disconnected | `07-component-architecture.md` §3.3 |

---

## 3. 组件测试矩阵

| ID | 组件 | 场景 1 | 场景 2 | 场景 3 | 对应 DDD |
|----|------|--------|--------|--------|----------|
| CT-01 | `DiscussionCreateCard` | 输入有效话题 + 选择 5 人 → 点击创建 → Store action 调用 | 空话题 → 按钮 disabled | 422 错误 → Toast | `03-user-flow.md` §1 |
| CT-02 | `ExpertCountSelector` | 默认值 4 → 修改为 8 → `modelValue` 更新 | 输入 3 → 校验失败 | — | `02-information-architecture.md` §4.1 |
| CT-03 | `ExpertCard` | props status=STANDBY → opacity 0.7 | status=PREPARING → opacity 0.85 + 边框微亮 | status=SPEAKING → opacity 1.0 + 边框 2px | `04-page-state-matrix.md` §5 |
| CT-04 | `HostCard` | 渲染主持人信息 + 替换按钮 disabled | — | — | `07-component-architecture.md` §2.3 |
| CT-05 | `PanelActions` | 开始按钮 → Store.start() | 重新生成 → ConfirmDialog → 确认 → Store.regenerateAll() | — | `03-user-flow.md` §4–5 |
| CT-06 | `CurrentSpeechBanner` | 初始无消息 → "等待开场..." | 收到 new_message → 内容更新 + 动画 | — | `06-page-layout.md` §4 |
| CT-07 | `ExpertSpot` | STANDBY/PREPARING/SPEAKING 三态样式切换 | `current_focus` 显示 | — | `07-component-architecture.md` §2.4 |
| CT-08 | `TranscriptPanel` | 新消息 → 自动滚动到底部 | 用户上滚 > 50px → 暂停 + 显示按钮 | 点击回到底部 → 恢复追随 | `08-interaction-specification.md` §2 |
| CT-09 | `TranscriptMessage` | 渲染发言人色块 + 姓名 + 头衔 + 内容 | OPENING/QUESTION/SUMMARY 等 7 种 message_type 正确渲染 | — | `06-page-layout.md` §4 |
| CT-10 | `ConsensusPanel` | 空列表 → "尚无共识与分歧" | 有数据 → 共识绿/分歧琥珀 渲染 | 新增条目 → 1s 高亮 | `06-page-layout.md` §4 |
| CT-11 | `WsConnectionIndicator` | status=connected → 绿圆点 | status=reconnecting → 黄闪烁 | status=disconnected → 红圆点 | `04-page-state-matrix.md` §4.2 |
| CT-12 | `ConfirmDialog` | 打开 → 焦点在取消按钮 | Tab 循环锁定 | Escape → 关闭 | `10-accessibility.md` §8 |
| CT-13 | `GlobalToast` | 单条 → 3s 消失 | 3 条堆叠 → 第 4 条移除最旧 | success/warning/error/info 四种样式 | `08-interaction-specification.md` §7 |
| CT-14 | `HostSummaryCard` | 总结文本渲染 | 超长总结（> 600 字）→ 内部滚动 | — | `06-page-layout.md` §5 |
| CT-15 | `DiscussionTopBar` | IN_PROGRESS → 显示 WS 指示器 + "结束讨论"按钮 | ENDED → 显示 ENDED 标签 | 返回按钮 → router.push('/') | `02-information-architecture.md` §5 |
| CT-16 | `DiscussionCard`（首页） | PENDING_PANEL/IN_PROGRESS/ENDED 三种状态标签渲染 | 点击 → 路由跳转 | — | `02-information-architecture.md` §4.1 |
| CT-17 | `PanelistSkeletonGrid` | expert_count=5 → 5 个占位卡片 | — | — | `04-page-state-matrix.md` §2 |
| CT-18 | `ScrollToBottomButton` | 显示 → 点击 → emit scroll-to-bottom | — | — | `08-interaction-specification.md` §2 |

---

## 4. E2E 测试矩阵

| ID | 用例 | 步骤 | 验证点 | 模式 |
|----|------|------|--------|------|
| E2E-01 | 创建讨论到确认阵容 | ①首页输入话题 ②选择 5 位专家 ③点击创建 ④等待嘉宾生成 ⑤查看阵容 ⑥点击开始 | ①创建按钮可用性 ②嘉宾卡片渲染 5 人 ③主持人 + 4 专家布局正确 | mock + real |
| E2E-02 | 实时讨论到结束 | ①开始讨论 ②观察 3–5 条发言 ③查看 Transcript 追加 ④查看共识面板更新 ⑤点击结束 ⑥查看总结 | ①WS 连接建立 ②发言内容实时更新 ③Transcript 自动滚动 ④共识分歧条目出现 ⑤主持人总结渲染 | mock + real |
| E2E-03 | 替换专家 | ①阵容确认页 ②点击某专家"替换" ③等待新专家生成 ④确认卡片内容已更新 ⑤新专家参与后续发言 | ①替换 loading 态 ②替换后卡片内容变化 ③新专家姓名出现在 Transcript | mock + real |
| E2E-04 | WS 断线重连 | ①讨论进行中 ②模拟网络断开 ③观察重连提示 ④恢复网络 ⑤讨论继续 | ①黄色重连指示器 ②Toast "连接已断开" ③恢复后状态同步 | mock |
| E2E-05 | 删除讨论 | ①首页 → 讨论列表有数据 ②点击某讨论卡片 ③点击删除 ④ConfirmDialog 确认 ⑤跳回首页 ⑥列表中该讨论已消失 | ①二次确认 ②路由跳转 ③列表更新 | mock + real |
| E2E-06 | API 错误 | ①创建讨论时填写 300 字话题（超长） ②观察 422 错误提示 | ①按钮不 disabled ②点击后 Toast 或字段错误提示 ③不过度阻塞 | mock |
| E2E-07 | 断线不可恢复 | ①讨论进行中 ②WS 重连 3 次均失败 ③页面显示错误遮罩 + 刷新按钮 | ①红色断开指示器 ②ErrorOverlay 渲染 ③点击刷新 → 页面重新加载 | mock |

---

## 5. 验收标准聚合表

| 功能域 | 关键验收标准 | 验证方式 |
|--------|-------------|----------|
| **创建讨论** | 话题 1–200 字校验；人数 4–8；默认 4；创建成功 1s 内跳转 | CT-01, UT-08, E2E-01 |
| **嘉宾生成** | skeleton 格数 = expert_count；生成失败 → 重试按钮；生成成功 → stagger 入场 | CT-17, UT-11, E2E-01 |
| **阵容确认** | 每位专家卡片显示色块/姓名/职业/立场；替换按钮仅 EXPERT 可用；单个替换后卡片更新；全部重新生成需二次确认 | CT-03–05, UT-12–13, E2E-03 |
| **演播厅实时** | WS 事件 → 发言更新 ≤ 200ms；嘉宾状态三态样式正确切换；当前发言横幅更新 ≤ 200ms | CT-07–08, UT-32–33, E2E-02 |
| **Transcript** | 新消息自动滚动；上滚暂停 + 回到底部按钮；虚拟滚动仅渲染可视区 | CT-08–09, E2E-02 |
| **共识/分歧** | 共识绿色/分歧琥珀色区分；新增条目 1s 高亮；独立滚动 | CT-10, UT-34, E2E-02 |
| **结束讨论** | 二次确认；总结生成等待；总结渲染；30s 超时提示 | CT-14, UT-15, E2E-02 |
| **删除讨论** | 任意状态可删；二次确认；成功后跳首页 | UT-10, E2E-05 |
| **WS 断线重连** | 1s→2s→4s 退避；重连携带 last_seq；3 次失败停止；指示器三态 | UT-21–23, CT-11, E2E-04 |
| **响应式** | 1440/1024/768/<768 四断点；专家网格自动换行；平板 Tab 切换；手机收起 | CT-07 (mobile viewport variant) |
| **无障碍** | Tab 导航；Dialog 焦点锁定；aria-live 播报；reduced-motion 禁用动画 | CT-12, manual a11y audit |
| **错误处理** | 422/404/409/429/502/503/500 各有一种可见反馈；不超过 3 条 Toast 堆叠 | CT-13, UT-08–17, E2E-06 |
| **幂等性** | /end 已 ENDED → 返回已有总结不重复；/start 已 IN_PROGRESS → 409 | UT-15, UT-14 |

---

## 6. 文档冲突报告

在 TDD 规划过程中未发现与 DDD v1.0 FROZEN 的冲突。发现的细微不一致已在 DDD 阶段修正：

| 已修正项 | 位置 | 修正内容 |
|----------|------|----------|
| Q3/Q4 动画残留 | `03-user-flow.md`, `07-component-architecture.md`, `10-accessibility.md` | 去除脉冲/呼吸动画引用，统一为静态样式 |

**当前状态：SDD ↔ DDD ↔ TDD 三阶段文档一致。**
