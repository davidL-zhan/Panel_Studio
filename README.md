# AI Panel Studio

> AI 圆桌讨论 Web App · Claude Code + DeepSeek V4 Pro · SDD → DDD → TDD

用户输入任意话题并指定专家人数，系统调用 DeepSeek 大模型动态生成主持人与专家阵容，实时推进一场沉浸式的 AI 圆桌讨论——主持人调度、专家辩论、共识与分歧持续提炼。

---

## 运行指南

### 环境要求

- **前端**：Node.js 18+ · npm 9+
- **后端**：Python 3.12+ · conda（推荐）

### 前端独立运行（Mock 模式，无需后端）

```bash
cd frontend
npm install
# 编辑 .env.development，设置 VITE_MOCK=true
npm run dev
```

浏览器访问 `http://localhost:5173`。Mock 模式下所有 API 调用返回内置样例数据，WebSocket 事件由内置模拟器按预设脚本自动发射，可完整体验创建讨论 → 生成嘉宾 → 演播厅 → 结束总结的全流程。

### 完整前后端运行

```bash
# 1. 后端
cd backend
conda create -n panel-studio python=3.12 -y
conda activate panel-studio
pip install -r requirements.txt
# 设置 DeepSeek API Key（必须通过系统环境变量，不写入文件）
# Windows CMD:    set DEEPSEEK_API_KEY=sk-your-key-here
# PowerShell:     $env:DEEPSEEK_API_KEY="sk-your-key-here"
# Linux/macOS:    export DEEPSEEK_API_KEY=sk-your-key-here
python scripts/init_db.py     # 初始化数据库表
python scripts/seed.py        # 插入 5 条样例数据
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 2. 前端（新终端）
cd frontend
npm install
# 编辑 .env.development，设置 VITE_MOCK=false
npm run dev
```

### 运行测试

```bash
cd frontend && npx vitest run         # 43 条单元 + 组件测试
cd frontend && npx playwright test    # 7 条 E2E 测试
cd backend && pytest                  # 10 条 API 测试
```

---

## 环境变量配置

### 后端

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DEEPSEEK_API_KEY` | DeepSeek API Key（**必填**，仅从系统环境变量读取，不写入文件） | — |
| `DEEPSEEK_BASE_URL` | API 地址 | `https://api.deepseek.com/v1` |
| `DEEPSEEK_MODEL` | 模型 ID | `deepseek-chat` |
| `DATABASE_URL` | SQLite 路径 | `sqlite+aiosqlite:///./panel_studio.db` |

`DEEPSEEK_BASE_URL`、`DEEPSEEK_MODEL`、`DATABASE_URL` 可通过 `.env` 文件配置，由 `load_dotenv()` 自动加载。

### 前端（`frontend/.env.development`）

| 变量 | 说明 | 可选值 |
|------|------|--------|
| `VITE_API_BASE` | 后端 REST API 地址 | `http://localhost:8000` |
| `VITE_WS_BASE` | 后端 WebSocket 地址 | `ws://localhost:8000` |
| `VITE_MOCK` | Mock 模式 | `true`（无需后端）/ `false`（连接真实后端） |

---

## 技术选型说明

| 层 | 技术 | 选型理由 |
|----|------|----------|
| 前端框架 | Vue 3 + Composition API | `<script setup>` 简洁 · 响应式 · 组件化 |
| 类型系统 | TypeScript 5.5 strict | WS 事件判别联合编译期校验 |
| 构建工具 | Vite 5 | HMR 极快开发反馈 |
| 状态管理 | Pinia 2 | 组合式 API 风格 · 3 Store（discussionList / discussion / websocket） |
| HTTP 客户端 | Axios | 拦截器统一错误分类（422/409/502 等） |
| 图标 | Lucide Vue Next | 轻量 SVG · Tree-shakeable |
| 后端框架 | FastAPI | 异步原生 · Pydantic v2 校验 · 自动 OpenAPI |
| ORM | SQLAlchemy 2.0 async | 异步引擎 · WAL 模式 · busy_timeout |
| 数据库 | SQLite | 零配置本地存储 |
| LLM | DeepSeek V4 Pro | `deepseek-chat` 模型 · 5 个场景 Prompt |
| 实时通信 | WebSocket | 11 种事件类型 · sequence_id 去重 · 暂停/恢复 |
| 样式方案 | CSS Variables | 60+ Design Token · 零运行时开销 · 暗色单主题 |
| 单元/组件测试 | Vitest + Vue Test Utils + happy-dom | Vite 原生集成 |
| E2E 测试 | Playwright | Chromium headless · Mock 模式运行 |
| 后端测试 | pytest + httpx | ASGITransport 内存测试 · 不走网络 |

---

## 主要 API 列表

| 方法 | 端点 | 说明 |
|------|------|------|
| `GET` | `/api/discussions` | 列出所有讨论（按创建时间倒序） |
| `POST` | `/api/discussions` | 创建讨论（`topic` 1–200 字，`expert_count` 4–8） |
| `GET` | `/api/discussions/:id` | 讨论详情（含嘉宾、最近发言、共识） |
| `DELETE` | `/api/discussions/:id` | 删除讨论（IN_PROGRESS 自动停止引擎 + 级联删除） |
| `POST` | `/api/discussions/:id/panel/generate` | LLM 生成嘉宾阵容（仅 PENDING_PANEL） |
| `POST` | `/api/discussions/:id/panel/regenerate` | 全部重新生成嘉宾（仅 PANEL_READY） |
| `GET` | `/api/discussions/:id/panel` | 获取嘉宾列表 |
| `PUT` | `/api/discussions/:id/panel/:pid` | 替换单个专家（请求体为空，后端调用 LLM） |
| `POST` | `/api/discussions/:id/start` | 开始讨论（原子乐观锁 `UPDATE WHERE status=PANEL_READY`） |
| `POST` | `/api/discussions/:id/end` | 结束讨论（幂等：已 ENDED 返回已有总结 · 引擎生成 SUMMARY Message） |
| `POST` | `/api/discussions/:id/continue` | 恢复暂停的讨论（每 30 轮自动暂停后调用） |
| `GET` | `/api/discussions/:id/transcript` | 分页获取 Transcript（`offset` + `limit`） |
| `GET` | `/api/discussions/:id/consensus` | 获取全部共识与分歧 |
| `WS` | `/ws/discussions/:id` | 实时事件流（连接即推 initial_state） |

**WebSocket 事件：**
`initial_state` · `discussion_started` · `panel_generated` · `panelist_status` · `new_message` · `consensus_update` · `host_prompt` · `discussion_paused` · `discussion_ended` · `discussion_deleted` · `error`

**HTTP 错误码：** `200` · `201` · `204` · `400` · `404` · `409` · `422` · `429` · `502` · `503` · `500`

---

## 已完成能力

### 业务流程（全部 4 个 DiscussionStatus 状态）

- [x] **首页**：讨论列表（按创建时间倒序）+ 创建讨论卡片（话题输入 · 4–8 专家选择器 · 字数校验 · 空话题不可提交）
- [x] **PENDING_PANEL**：自动调用 LLM 生成嘉宾阵容 · skeleton 加载态 · 失败自动重试 + 手动重新生成
- [x] **PANEL_READY**：主持人卡片 + 专家卡片阵列（色块/姓名/职业/立场）· 单独替换专家（请求体为空，后端 LLM 生成替代）· 全部重新生成（二次确认）· 开始讨论 · 操作按钮吸底固定
- [x] **IN_PROGRESS 演播厅**：舞台区（固定高度）+ 当前发言大字横幅 + 共识面板 + Transcript 面板 · VITE_MOCK=false 时连接真实 WebSocket 实时驱动
- [x] **ENDED**：主持人自然语言总结 + 完整共识/Transcript 回顾 + 返回首页 / 删除讨论（二次确认）

### 嘉宾状态可视化

- [x] **STANDBY**：opacity 0.7 静态卡片
- [x] **PREPARING**：opacity 0.85 + 嘉宾色 1px 边框微亮（静态，无动画）
- [x] **SPEAKING**：opacity 1.0 + 嘉宾色 2px 边框高亮 + 背景微提亮 8%（静态，无脉冲）

### 实时演播厅

- [x] 主持人调度发言 + 专家举手/抢答/补充/反驳 · 每次发言 1–2 句 · 禁止机械轮流
- [x] 共识/分歧每 3–5 次发言后 LLM 自动提炼，实时推送
- [x] Transcript 独立滚动 · 自动追随最新 · 手动上滚 50px 暂停 + 回到底部按钮 · 完整显示所有发言
- [x] WebSocket 连接三态指示（DiscussionTopBar 绿已连接 / 黄重连中 / 红已断开）
- [x] WS 连接横幅（连接中/重连中/已断开状态提示）
- [x] 每 30 轮发言自动暂停：主持人阶段性总结 + 询问是否继续 · 60s 无响应自动暂停 · 前端"继续讨论"按钮恢复 · WS `host_prompt` / `discussion_paused` 事件

### 响应式布局

- [x] 超宽屏 ≥1440px · 桌面 ≥1024px · 平板 768–1023px · 手机 <768px
- [x] 平板端双栏自动切换 Tab 模式（共识 / Transcript）
- [x] 手机端 ExpertCard 紧凑模式（色块 + 姓名 + 状态指示器，隐藏职业/立场）
- [x] 手机端创建卡片垂直堆叠
- [x] 各区域独立滚动，页面不出整页滚动条

### 无障碍（WCAG AA）

- [x] 对比度全部 ≥ 4.5:1（暗色基线天然优势）
- [x] 跳过链接（skip-link）+ `:focus-visible` 全局焦点轮廓
- [x] 专家网格 `role="grid"` + Arrow 键导航 + `role="gridcell"` + `aria-label` 状态描述
- [x] Dialog `role="dialog"` + `aria-modal` + Tab 循环锁定 + Escape 关闭
- [x] Transcript `role="log"` + `aria-live="polite"` 自动播报
- [x] 当前发言区 `role="status"` + `aria-live="polite"` 实时播报
- [x] 共识面板 `role="feed"`
- [x] Toast `role="alert"` 错误立即播报
- [x] 状态三重编码（颜色 + 图标 + 文字标签 · sr-only 备选）
- [x] `prefers-reduced-motion` 禁用全部动画

### 工程化

- [x] 暗色单主题 · 60+ CSS Design Token 变量
- [x] 10 色嘉宾身份色板 + 4 色系统状态色 + 2 色共识/分歧色（三套色系严格分离）
- [x] UI UX Pro Max 设计智能集成（采纳 9 项 / 拒绝 6 项 / 定制融合）
- [x] 类型安全的 WebSocket 事件判别联合（discriminated union）
- [x] 原子性乐观锁（`UPDATE WHERE status = :expected` 防止竞态）
- [x] LLM 输出校验层（speaker_id 引用完整性 · experts 数量 · 字段存在性 · 重试注入 · 错误日志隔离）
- [x] SQLite WAL 模式 + `busy_timeout=5000` + 连接池
- [x] 北京时间存储（`BEIJING_TZ = timezone(timedelta(hours=8))`）
- [x] Mock API 层（VITE_MOCK 一键切换，无需后端即可完整演示）

### 测试

| 层级 | 框架 | 数量 |
|------|------|------|
| 前端单元 | Vitest | 30 |
| 前端组件 | Vue Test Utils | 13 |
| E2E | Playwright | 7 |
| 后端 API | pytest + httpx | 10 |
| **合计** | | **60** |

---

## 后续改进方向

- [ ] **录制/回放**：DDD 已预留数据接口（Message 完整 Transcript 可重放），待实现播放控制 UI
- [ ] **Transcript 虚拟滚动**：当前简单 DOM 渲染可处理 <200 条；长讨论需集成 `vue-virtual-scroller`
- [ ] **讨论断点续跑**：服务重启后 IN_PROGRESS 讨论自动恢复引擎
- [ ] **亮色主题**：Design Token 体系已预留扩展性
- [ ] **国际化 i18n**：当前仅中文 UI
- [ ] **后端 LLM mock 测试**：覆盖 5 个 LLM 场景的 mock 响应 + 校验层验证
- [ ] **前端覆盖率报告**：Vitest coverage 阈值配置
- [ ] **CI/CD**：GitHub Actions 自动化测试 + 构建

---

## 项目结构

```
Panel_Studio/
├── README.md
├── frontend/               # Vue 3 + TS + Vite + Pinia（55 源文件 · 35 组件）
│   ├── src/
│   │   ├── types/          # 6 枚举 · 4 领域实体 · API DTO · WS 事件判别联合
│   │   ├── constants/      # 10 色嘉宾色板 · Design Token 常量
│   │   ├── styles/         # 60+ CSS Variables + Reset + skip-link
│   │   ├── api/            # Axios 封装 + 13 端点 + VITE_MOCK 动态切换
│   │   ├── stores/         # Pinia（discussionList · discussion · websocket）
│   │   ├── composables/    # useToast · useMediaQuery
│   │   ├── mocks/          # Mock API · Mock WebSocket 事件模拟器
│   │   ├── components/     # 32 组件（shared / home / panel / studio / transcript / consensus / ended / layout）
│   │   └── views/          # HomePage · DiscussionPage
│   └── tests/              # unit/ · components/ · e2e/
├── backend/                # FastAPI + SQLAlchemy + SQLite + DeepSeek API（14 文件）
│   ├── app/
│   │   ├── config.py       # API Key 仅环境变量读取 · load_dotenv() 备选配置
│   │   ├── database.py     # 4 ORM · 异步引擎 · WAL · 北京时间
│   │   ├── schemas.py      # 12 Pydantic Schema
│   │   ├── llm.py          # 5 LLM 场景 · 输出校验 · 错误日志隔离
│   │   ├── engine.py       # 后台讨论引擎（asyncio Task · 回合循环 · 共识提炼 · 总结）
│   │   ├── ws_manager.py   # WS 连接管理 · 广播/单播 · sequence_id
│   │   └── main.py         # 13 REST + 1 WS + CORS + 原子乐观锁
│   ├── scripts/            # init_db.py · seed.py（5 条预设样例）
│   └── tests/              # API 测试 · 集成测试
└── docs/                   # 25 份文档
    ├── sdd/                # 5 份 SDD（领域模型 · API 契约 · DB Schema · LLM 协议 · 校验层）
    ├── ddd/                # 12 份 DDD（设计概要 · 信息架构 · 用户流程 · 状态矩阵 · 布局 · 组件树 · 响应式 · 无障碍）
    ├── tdd/                # 3 份 TDD（技术方案 · 任务拆解 · 测试矩阵）
    ├── spec/               # SDD 交叉一致性审查报告（28 项修复）
    ├── prompts.md          # 6 段核心 Prompt 记录（SDD/DDD/TDD/E2E 四阶段）
    └── workflow.md         # 开发工作流说明 + 3 个典型 AI 协同问题
```
