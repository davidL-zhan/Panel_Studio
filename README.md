# AI Panel Studio

> AI 圆桌讨论 Web App · Claude Code + DeepSeek V4 Pro · SDD → DDD → TDD

用户输入任意话题，系统调用大模型动态生成主持人与专家阵容，实时推进一场沉浸式的 AI 圆桌讨论——主持人调度、专家辩论、共识与分歧实时提炼。

## 项目结构

```
Panel_Studio/
├── frontend/          # Vue 3 + TypeScript + Vite + Pinia
├── backend/           # FastAPI + SQLAlchemy + SQLite + DeepSeek API
└── docs/              # SDD(5) + DDD(12) + TDD(3) + 交付文档(3)
```

## 快速开始

```bash
# 1. 后端
cd backend
conda create -n panel-studio python=3.12 -y
conda activate panel-studio
pip install -r requirements.txt
cp .env.example .env   # 编辑 .env 填入 DEEPSEEK_API_KEY
python scripts/init_db.py
python scripts/seed.py
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 2. 前端（新终端）
cd frontend
npm install
npm run dev             # VITE_MOCK=false 连真实后端
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DEEPSEEK_API_KEY` | DeepSeek API Key（必填） | — |
| `DEEPSEEK_BASE_URL` | API 地址 | `https://api.deepseek.com/v1` |
| `DEEPSEEK_MODEL` | 模型 ID | `deepseek-chat` |
| `DATABASE_URL` | SQLite 路径 | `sqlite+aiosqlite:///./panel_studio.db` |
| `VITE_API_BASE` | 前端连后端地址 | `http://localhost:8000` |
| `VITE_MOCK` | 前端 Mock 模式 | `true`（无需后端） |

## 技术选型

| 层 | 技术 |
|----|------|
| 前端框架 | Vue 3 + TypeScript + Vite |
| 状态管理 | Pinia |
| 后端框架 | FastAPI + Pydantic v2 |
| 数据库 | SQLite + SQLAlchemy 2.0 (async) |
| LLM | DeepSeek V4 Pro API |
| 实时通信 | WebSocket |
| 测试 | Vitest + Vue Test Utils + Playwright |

## 运行测试

```bash
cd frontend && npm run test     # 前端 43 条测试
cd backend && pytest             # 后端测试
```

## 文档

- [SDD 契约/模型驱动](docs/sdd/) — 领域模型 · API 契约 · 数据库 Schema · LLM 协议
- [DDD 设计驱动](docs/ddd/) — 设计概要 · 信息架构 · 页面布局 · 组件树 · Design System
- [TDD 测试驱动](docs/tdd/) — 技术方案 · 任务拆解 · 测试矩阵
- [核心 Prompt 记录](docs/prompts.md)
- [开发工作流说明](docs/workflow.md)
