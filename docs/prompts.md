# 核心 Prompt 记录文档

> AI Panel Studio · Claude Code + DeepSeek V4 Pro · 2026-08-05

---

## 【SDD 阶段】数据建模与 API 契约生成

### Prompt 1：需求分析与交叉一致性审查

```
请阅读 docs/assignment.md。当前阶段只进行 SDD 需求分析，不生成前后端业务代码。
请完成以下工作：
1. 提取所有明确的业务需求
2. 区分功能需求、非功能需求、技术约束和交付要求
3. 找出存在歧义、冲突或缺失的信息
4. 列出需要我确认的问题
5. 不得自行补充未经确认的业务规则
```

**当时意图：** 让 AI 从原始作业需求文档中系统性地提取和组织需求，作为 SDD 数据建模的事实基础。

**遇到的问题：** 原始需求文档存在多处有意为之的模糊点（如专家人数范围未指定、讨论结束条件未定义等），AI 正确识别了 14 处缺失信息并逐条列出要求确认，没有自行脑补。

**引导 AI 修正：** 无需修正。AI 正确区分了"提取需求"和"补充业务规则"的边界。

---

### Prompt 2：SDD 数据建模

```
基于确认的需求，生成 SDD 阶段的完整建模和契约文档。
需要产出：01-domain-model, 02-api-contract, 03-database-schema, 04-llm-protocol
技术栈：Vue3 前端 / FastAPI+Pydantic+SQLAlchemy+SQLite 后端 / DeepSeek API+WebSocket
```

**当时意图：** 一次性产出 4 份相互关联的 SDD 文档，确保实体定义、API 契约、数据库 Schema 和 LLM 交互协议之间的一致性。

**遇到的问题：** 初次生成的文档之间存在字段名不一致（API 响应中的 JOIN 衍生字段未在领域模型中声明）、枚举值遗漏（MessageType.SUMMARY 定义了但无 LLM 场景创建）、状态机存在不可达转换（PANEL_READY→PENDING_PANEL 无 API 入口）。

**引导 AI 修正：** 通过"交叉一致性审查"Prompt，让 AI 以审查者身份逐文档对比，发现 28 项不一致。修复过程采用了"问题定位→逐文件修正→验证清零"的三步法，最终所有文档标注了修复标记 `[→ XX-XX 修复]`。

---

## 【DDD 阶段】前端组件与页面生成

### Prompt 3：DDD 设计文档生成

```
现在正式进入 DDD 阶段。本项目中的 DDD 指 Design-Driven Development，不是 Domain-Driven Design。
必须调用已安装的 UI UX Pro Max Skill 进行设计研究。当前只进行产品设计、交互设计和前端架构设计。
暂时不要编写 FastAPI 后端、不要调用 DeepSeek API、不要实现数据库、不要生成完整 Vue 页面代码。
设计关键词：专业、理性、克制、演播厅、圆桌对话、当前发言人视觉聚焦、实时讨论状态、清晰的信息层级。
禁止：通用后台管理系统布局、左侧固定管理导航栏、大量统计卡片、高饱和赛博朋克风格、过度玻璃拟态、无意义渐变、大量持续动画、只依靠颜色表达状态。
```

**当时意图：** 在 SDD 数据模型锁定的前提下，进入设计阶段。利用 UI UX Pro Max 插件获取专业的设计 Token 建议，转化为 12 份 DDD 设计文档。

**遇到的问题：** UI UX Pro Max 生成的"Exaggerated Minimalism"风格偏向营销落地页（Video-First Hero、12rem 超大字体），不完全匹配"广播演播厅"的产品定位。需要在采纳设计智能建议的同时，根据产品语境进行定向裁剪。

**引导 AI 修正：** 在 `ui-ux-pro-max-usage.md` 中记录了 6 项拒绝的 UI UX Pro Max 建议及替代方案，明确了"SDD 约束优先于第三方设计建议"的原则。最终的暗色演播厅视觉体系是"Style 建议 70% + 产品定制 30%"的融合结果。

---

### Prompt 4：设计决策确认与文档一致性

```
对当前 docs/ddd 下已经生成的完整 DDD 文档。
现在不要编写任何实现代码，请以高级软件架构审查者的身份，对所有 SDD 文件进行交叉一致性审查。
重点检查：业务实体一致性、状态枚举一致性、状态机完整性、API 与领域模型一致性、WS 事件与业务状态一致性、错误码覆盖、验收标准可测性、未经确认的需求扩展、AI 非确定性规则、并发/幂等/重连问题。
```

**当时意图：** 在 DDD 设计文档写成后，回过来验证 DDD 设计是否与 SDD 契约一致，特别是视觉状态映射是否正确（PanelistStatus 三态、DiscussionStatus 四态、WebSocket 连接三态）。

**遇到的问题：** 发现 DDD 文档中存在与最终设计决策（Q3/Q4）冲突的残留引用——多处文档仍写着"色块脉冲动画"和"边框呼吸动画"，而最终决策明确要求静态视觉聚焦。

**引导 AI 修正：** 通过全局 grep 检索"脉冲|呼吸|pulse"关键词，定位到 3 个文件（03-user-flow.md、07-component-architecture.md、10-accessibility.md）的残留错误描述，逐一修改为统一的静态样式描述。最终确认所有残留已清零。

---

## 【TDD 阶段】核心逻辑的测试用例编写与业务实现

### Prompt 5：TDD 测试验证

```
进入 TDD 测试阶段。
按照 TDD 文档中的测试矩阵设置测试基础设施并编写测试。
需要编写：枚举值校验、色板校验、Design Token 常量校验、DiscussionStore 核心逻辑、ExpertCard 三态视觉、ConfirmDialog 焦点管理、WsConnectionIndicator 三态。
```

**当时意图：** 在 DDD 前端实现完成后，用测试验证核心逻辑的正确性，确保枚举值完整、Store 状态流转正确、组件状态视觉映射符合 DDD 规范。

**遇到的问题：** `<Teleport>` 组件在 happy-dom 测试环境中将内容渲染到 `document.body` 外部，导致 `wrapper.find('[role="dialog"]')` 返回空。需要改用 `attachTo: document.body` 挂载选项，并通过 `document.body.querySelector` 查找 teleported 元素。

**引导 AI 修正：** 经过两次迭代：第一次改用 `document.body.querySelector` 但事件不触发；第二次加入 `attachTo: document.body` 确保事件系统正确绑定。最终 43 条测试全部通过。

---

## 总结

| 阶段 | Prompt 数 | 典型挑战 | 解决方式 |
|------|----------|----------|----------|
| SDD | 2 | 文档间一致性维护（28 项不一致） | 交叉审查 → 逐文件修复 → 验证清零 |
| DDD | 2 | UI 设计智能建议与产品语境的冲突 | 记录拒绝项 → 定制融合 → 回验 SDD 约束 |
| TDD | 1 | Teleport 组件在测试环境的渲染问题 | 调试 mount 选项 → attachTo + querySelector |
