# DDD — Design-Driven Development 总览

> **版本：DDD v1.0 FROZEN** · 2026-08-05
>
> 本版本已通过 11 项设计决策确认，所有文档间交叉一致性已验证。后续 TDD 实现阶段以此为唯一 UI/UX 事实来源，不再修改。

---

## 文档索引

| # | 文档 | 大小 | 核心内容 |
|---|------|------|----------|
| 01 | `01-design-brief.md` | 5.0 KB | 产品目标 · 设计原则 · 视觉关键词 · 禁止模式 |
| 02 | `02-information-architecture.md` | 3.9 KB | 路由 · 页面层级 · 信息优先级 |
| 03 | `03-user-flow.md` | 5.9 KB | 11 条 Mermaid 用户流程图 |
| 04 | `04-page-state-matrix.md` | 5.1 KB | DiscussionStatus/PanelistStatus → 视觉映射 |
| 05 | `05-design-system.md` | 9.4 KB | 颜色 · 字体 · 间距 · 组件 · 动画 Token |
| 06 | `06-page-layout.md` | 19.5 KB | 7 页 ASCII 线框图（含桌面/平板/手机） |
| 07 | `07-component-architecture.md` | 8.8 KB | Vue 3 组件树 · Pinia Store · Props/Emits 契约 |
| 08 | `08-interaction-specification.md` | 5.9 KB | 操作反馈 · 滚动行为 · WS 生命周期 · API 错误映射 |
| 09 | `09-responsive-design.md` | 6.7 KB | 4 断点 · 4–8 人网格矩阵 · 演播厅三段式适配 |
| 10 | `10-accessibility.md` | 6.3 KB | WCAG AA 对比度 · 键盘导航 · ARIA · reduced-motion |
| — | `ui-ux-pro-max-usage.md` | 4.8 KB | UI UX Pro Max 调用的能力/采纳/拒绝记录 |
| — | `open-design-questions.md` | 4.0 KB | 11 项问题 + 最终决策记录 |

---

## 关键设计决策（已确认，不可回退）

| 决策 | 说明 |
|------|------|
| 暗色单主题 | 深蓝灰 `#0B0B14`，不提供亮色切换 |
| 舞台焦点式布局 | 嘉宾区固定高度 + 当前发言横幅 + 双栏独立滚动 |
| 共识左 / Transcript 右 | 桌面 35%/65% 分栏，平板 Tab 切换 |
| 静态视觉聚焦 | SPEAKING = 边框高亮 2px + 背景微提亮 +10%，**无脉冲/呼吸动画** |
| PREPARING 无动画 | opacity 0.85 + 边框微亮静态 |
| 10 色嘉宾身份色板 | 前端分配，CSS 变量驱动，与系统状态色/共识分歧色严格分离 |
| Inter + 系统 CJK 字体 | PingFang SC (Mac) / Microsoft YaHei (Win) |
| Pinia 状态管理 | 3 Store：discussionList / discussion / webSocket |
| 单一路由状态驱动 | `/discussions/:id` + DiscussionStatus 驱动视图切换 |
| Toast 堆叠 ≤3 条 | 右上角，每条独立 3s 计时 |
| 僵尸讨论 30s 自动提示 | WS 心跳超时无事件 → 提示用户 |
| Transcript 虚拟滚动 | vue-virtual-scroller 或自建 |
| 手机嘉宾卡片默认收起 | 色块 + 姓名 + 状态圆点，点击展开 |
| 底部 safe-area-inset-bottom | 防止系统导航栏遮挡 |

---

## 上游依赖

- `docs/sdd/01-domain-model.md` — 实体定义与状态枚举
- `docs/sdd/02-api-contract.md` — REST + WebSocket 协议
- `docs/sdd/04-llm-protocol.md` — 嘉宾色板 (10 色)
- `design-system/ai-panel-studio/MASTER.md` — UI UX Pro Max 设计基线
