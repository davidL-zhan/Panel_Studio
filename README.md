# AI Panel Studio

> AI 圆桌讨论 Web App · Claude Code + DeepSeek V4 Pro · SDD → DDD → TDD

用户输入任意话题并指定专家人数，系统调用大模型动态生成主持人与专家阵容，实时推进一场沉浸式的 AI 圆桌讨论——主持人调度、专家辩论、共识与分歧持续提炼。

---

## 运行指南

### 环境要求

- **前端**：Node.js 18+ · npm 9+
- **后端**：Python 3.12+ · conda（推荐）

### 前端独立运行（Mock 模式，无需后端）

```bash
cd frontend
npm install
npm run dev
```

浏览器访问 `http://localhost:5173`。Mock 模式下所有 API 调用返回内置样例数据，WebSocket 事件由内置模拟器按预设脚本自动发射，可完整体验全流程。

### 完整前后端运行

```bash
# 1. 后端
cd backend
conda create -n panel-studio python=3.12 -y
conda activate panel-studio
pip install -r requirements.txt
# 设置 DeepSeek API Key（从系统环境变量读取，不写入文件）
export DEEPSEEK_API_KEY=sk-your-key-here        # Linux/macOS
set DEEPSEEK_API_KEY=sk-your-key-here           # Windows CMD
$env:DEEPSEEK_API_KEY="sk-your-key-here"        # Windows PowerShell
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
cd frontend && npm run test       # 43 条单元 + 组件测试
cd frontend && npx playwright test # 7 条 E2E 测试
cd backend && pytest               # 10 条 API 测试
```

---

## 环境变量配置

### 后端（系统环境变量）

| 变量                  | 说明                                                 | 默认值                                    |
| --------------------- | ---------------------------------------------------- | ----------------------------------------- |
| `DEEPSEEK_API_KEY`  | DeepSeek API Key（**必填**，仅从环境变量读取） | —                                        |
| `DEEPSEEK_BASE_URL` | API 地址                                             | `https://api.deepseek.com/v1`           |
| `DEEPSEEK_MODEL`    | 模型 ID                                              | `deepseek-v4-flash`                     |
| `DATABASE_URL`      | SQLite 数据库路径                                    | `sqlite+aiosqlite:///./panel_studio.db` |

> `DEEPSEEK_API_KEY` 必须通过系统环境变量设置。其余变量可写入 `.env` 文件，由 `load_dotenv()` 自动加载。

### 前端（`frontend/.env.development`）

| 变量              | 说明                  | 默认值                    |
| ----------------- | --------------------- | ------------------------- |
| `VITE_API_BASE` | 后端 REST API 地址    | `http://localhost:8000` |
| `VITE_WS_BASE`  | 后端 WebSocket 地址   | `ws://localhost:8000`   |
| `VITE_MOCK`     | Mock 模式（无需后端） | `true`                  |

---

## 技术选型说明

| 层            | 技术                                | 选型理由                                                |
| ------------- | ----------------------------------- | ------------------------------------------------------- |
| 前端框架      | Vue 3 + Composition API             | 组件化 + 响应式 +`<script setup>` 简洁                |
| 类型系统      | TypeScript 5.5 strict               | WS 事件判别联合、API DTO 编译期校验                     |
| 构建工具      | Vite 5                              | HMR 极快开发反馈                                        |
| 状态管理      | Pinia 2                             | Vue 3 官方推荐，组合式 API 风格                         |
| HTTP 客户端   | Axios                               | 拦截器统一错误分类（422/409/502 等）                    |
| 图标          | Lucide Vue Next                     | 轻量 SVG 图标，Tree-shakeable                           |
| 后端框架      | FastAPI                             | 异步原生支持 + Pydantic v2 自动校验 + 自动 OpenAPI 文档 |
| ORM           | SQLAlchemy 2.0 async                | 异步引擎 + WAL 模式并发写入                             |
| 数据库        | SQLite                              | 作业要求，零配置，本地文件存储                          |
| 大模型        | DeepSeek V4 Pro                     | 作业要求，`deepseek-chat` 模型                        |
| 实时通信      | WebSocket                           | 原生支持，双向事件流                                    |
| 样式方案      | CSS Variables                       | Design Token 体系，零运行时开销                         |
| 单元/组件测试 | Vitest + Vue Test Utils + happy-dom | Vite 原生集成，速度快                                   |
| E2E 测试      | Playwright                          | Chromium headless，Mock 模式运行                        |
| 后端测试      | pytest + httpx                      | ASGITransport 内存测试，不走网络                        |

---

## 主要 API 列表

| 方法       | 端点                                      | 说明                                                   |
| ---------- | ----------------------------------------- | ------------------------------------------------------ |
| `GET`    | `/api/discussions`                      | 列出所有讨论（按创建时间倒序）                         |
| `POST`   | `/api/discussions`                      | 创建讨论（`topic` 1–200 字，`expert_count` 4–8） |
| `GET`    | `/api/discussions/:id`                  | 讨论详情（含嘉宾、最近发言、共识）                     |
| `DELETE` | `/api/discussions/:id`                  | 删除讨论（IN_PROGRESS 自动停止引擎）                   |
| `POST`   | `/api/discussions/:id/panel/generate`   | LLM 生成嘉宾阵容（仅 PENDING_PANEL）                   |
| `POST`   | `/api/discussions/:id/panel/regenerate` | 全部重新生成嘉宾（仅 PANEL_READY）                     |
| `GET`    | `/api/discussions/:id/panel`            | 获取嘉宾列表                                           |
| `PUT`    | `/api/discussions/:id/panel/:pid`       | 替换单个专家（请求体为空，后端调用 LLM）               |
| `POST`   | `/api/discussions/:id/start`            | 开始讨论（原子乐观锁，启动后台引擎）                   |
| `POST`   | `/api/discussions/:id/end`              | 结束讨论（幂等，生成主持人总结）                       |
| `GET`    | `/api/discussions/:id/transcript`       | 分页获取 Transcript（`offset` + `limit`）          |
| `GET`    | `/api/discussions/:id/consensus`        | 获取全部共识与分歧                                     |
| `WS`     | `/ws/discussions/:id`                   | 实时事件流（9 种事件类型）                             |

WebSocket 事件：`initial_state` · `discussion_started` · `panel_generated` · `panelist_status` · `new_message` · `consensus_update` · `discussion_ended` · `discussion_deleted` · `error`

错误码：`200` · `201` · `204` · `400` · `404` · `409` · `422` · `429` · `502` · `503` · `500`

---

## 已完成能力

### 业务流程（全部 4 个 DiscussionStatus 状态）

- [X] **首页**：讨论列表（按时间倒序）+ 创建讨论（话题输入 + 4–8 位专家选择器）
- [X] **PENDING_PANEL**：自动调用 LLM 生成嘉宾阵容 · skeleton 加载态 · 失败重试
- [X] **PANEL_READY**：主持人 + 专家卡片阵列 · 单独替换专家 · 全部重新生成（二次确认）· 开始讨论
- [X] **IN_PROGRESS 演播厅**：舞台区 + 当前发言横幅 + 共识面板 + Transcript 面板 · WebSocket 实时事件驱动
- [X] **ENDED**：主持人自然语言总结 + 完整共识/Transcript 回顾 + 返回首页 / 删除讨论

### 嘉宾状态可视化

- [X] **STANDBY**：opacity 0.7 静态卡片
- [X] **PREPARING**：opacity 0.85 + 嘉宾色 1px 边框微亮（静态，无动画）
- [X] **SPEAKING**：opacity 1.0 + 嘉宾色 2px 边框高亮 + 背景微提亮 8%（静态，无脉冲）

### 实时演播厅

- [X] 主持人调度发言 + 专家举手/抢答/补充/反驳
- [X] 每次发言控制在 1–2 句 · 禁止机械轮流
- [X] 共识/分歧每 3–5 次发言后自动提炼，实时更新
- [X] Transcript 独立滚动 · 自动追随最新 · 手动上滚暂停 + 回到底部按钮
- [X] WebSocket 连接三态指示（绿已连接 / 黄重连中 / 红已断开）
- [X] 讨论引擎崩溃 30s 无事件自动提示

### 响应式布局

- [X] 超宽屏 ≥1440px · 桌面 ≥1024px · 平板 768–1023px · 手机 <768px
- [X] 平板端双栏自动切换 Tab 模式（共识 / Transcript）
- [X] 手机端 ExpertCard 紧凑模式（色块 + 姓名 + 状态指示器）
- [X] 各区域独立滚动，页面不出整页滚动条

### 无障碍

- [X] 对比度全部 ≥ 4.5:1（WCAG AA）
- [X] 跳过链接 + focus-visible 焦点轮廓
- [X] 专家网格 role="grid" + Arrow 键导航
- [X] Dialog role="dialog" + Tab 循环锁定 + Escape 关闭
- [X] Transcript role="log" + aria-live 自动播报
- [X] 状态三重编码（颜色 + 图标 + 文字）
- [X] prefers-reduced-motion 禁用全部动画

### 设计与工程化

- [X] 暗色单主题 · 60+ CSS Design Token 变量
- [X] 10 色嘉宾身份色板 + 4 色系统状态色 + 2 色共识/分歧色（三套色系严格分离）
- [X] UI UX Pro Max 设计智能集成（采纳 9 项 / 拒绝 6 项 / 定制融合）
- [X] 类型安全的 WebSocket 事件判别联合 + sequence_id 去重
- [X] 原子性乐观锁（`UPDATE WHERE status = :expected`）
- [X] LLM 输出校验层（引用完整性检查 + 字段存在性 + 重试注入）

### 测试

- [X] 前端 43 条（30 单元 + 13 组件）· Vitest + Vue Test Utils
- [X] E2E 7 条 · Playwright + Chromium headless
- [X] 后端 10 条 · pytest + httpx ASGITransport

---

## 后续改进方向

- [ ] **录制/回放**：DDD 已预留数据接口（Message 完整 Transcript 可重放），待实现播放控制 UI
- [ ] **Transcript 虚拟滚动**：当前简单 DOM 渲染可处理 <200 条消息；长讨论需集成 `vue-virtual-scroller`
- [ ] **讨论断点续跑**：服务重启后 IN_PROGRESS 讨论自动恢复引擎
- [ ] **亮色主题**：Design Token 体系已预留扩展性，仅需增加亮色变量覆盖
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
│   │   ├── types/          # 枚举 · 领域实体 · API DTO · WebSocket 事件联合
│   │   ├── constants/      # 色板 · Design Token 常量
│   │   ├── styles/         # CSS Variables + Reset + skip-link
│   │   ├── api/            # Axios 封装 + 全部端点 + VITE_MOCK 动态切换
│   │   ├── stores/         # Pinia（discussion-list · discussion · websocket）
│   │   ├── composables/    # useToast · useMediaQuery
│   │   ├── mocks/          # Mock API · Mock WebSocket 事件模拟器
│   │   ├── components/     # 32 个组件（shared / home / panel / studio / transcript / consensus / ended / layout）
│   │   └── views/          # HomePage · DiscussionPage
│   └── tests/              # unit/ · components/ · e2e/
├── backend/                # FastAPI + SQLAlchemy + SQLite + DeepSeek API（14 文件）
│   ├── app/
│   │   ├── database.py     # 4 个 ORM 模型 + 异步引擎 + WAL PRAGMA
│   │   ├── schemas.py      # 12 个 Pydantic Schema
│   │   ├── llm.py          # 5 个 LLM 场景 Prompt + 调用 + 输出校验
│   │   ├── engine.py       # 后台讨论引擎（asyncio Task 驱动回合循环 + 共识提炼 + 总结）
│   │   ├── ws_manager.py   # WebSocket 连接管理 + 广播/单播 + sequence_id
│   │   └── main.py         # 13 REST 端点 + 1 WebSocket 端点 + CORS
│   ├── scripts/            # init_db.py + seed.py（5 条预设样例数据）
│   └── tests/              # pytest API 测试
└── docs/                   # 18 份文档
    ├── sdd/                # 5 份 SDD（领域模型 · API 契约 · DB Schema · LLM 协议 · 校验层）
    ├── ddd/                # 12 份 DDD（设计概要 · 信息架构 · 用户流程 · 状态矩阵 · 布局 · 组件树 · 响应式 · 无障碍）
    ├── tdd/                # 3 份 TDD（技术方案 · 任务拆解 · 测试矩阵）
    ├── prompts.md          # 6 段核心 Prompt 记录（SDD/DDD/TDD/E2E 四阶段）
    ├── workflow.md         # 开发工作流说明 + 3 个典型问题
    └── spec/               # SDD 交叉一致性审查报告
```
