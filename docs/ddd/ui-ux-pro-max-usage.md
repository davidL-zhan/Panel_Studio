# UI UX Pro Max Usage Record

> DDD 阶段 · 设计智能工具使用记录 · AI Panel Studio

---

## 1. 调用的能力

| 能力 | 命令 | 用途 |
|------|------|------|
| **Design System 生成** | `--design-system -p "AI Panel Studio" --persist` | 生成全局颜色、字体、间距、阴影、动效 Token 基线 |
| **设计调校** | `--variance 3 --motion 4 --density 4` | 锁定克制/专业风格：低视觉变化度、标准动效、标准信息密度 |
| **暗色主题色板检索** | `--domain color` 搜索 "dark professional broadcast" | 获取 5 组参考色板，最终选用"Music Creation"的深蓝紫基调 |
| **排版配对检索** | `--domain typography` 搜索 "professional sans serif" | 获取 Inter 字体建议；Lexend+Source Sans 3 因 CJK 回退问题不采用 |
| **实时 UX 指南** | `--domain ux` 搜索 "real-time live streaming" | 确认 streaming 反馈、skeleton 加载、状态转换等交互模式 |
| **Vue 3 栈指南** | `--stack vue` 搜索 "component architecture" | 确认 Pinia（非 Vuex）、shallowReactive 优化建议 |

---

## 2. 采用的建议

| 建议来源 | 内容 | 采用方式 |
|----------|------|----------|
| Design System | Inter 字体 | 全项目西文/数字字体 |
| Design System | 间距 Token 体系 (Density 4) | 完整采用 7 级间距变量 |
| Design System | 阴影层级 (sm/md/lg/xl) | 采用 + 新增 `--shadow-glow` 聚光阴影 |
| Design System | 动画：stagger list, back.out easing | 嘉宾卡片入场动画采用；数据密集区（Transcript）不采用 back.out |
| Design System | Pre-Delivery Checklist | 全部采纳（禁止 emoji 图标、光标 pointer、hocus 过渡、对比度、a11y） |
| Design System | Anti-Patterns | 全部采纳（禁止 AI 紫/粉、过度玻璃拟态、无意义渐变） |
| Color 搜索 | 深蓝紫 #0F0F23 背景基调 | 微调至 #0B0B14（更深沉、对比度更优） |
| Vue 栈 | Pinia 替代 Vuex | 全部 3 个 Store 基于 Pinia |
| UX 指南 | Streaming 反馈（skeleton 而非 spinner） | 嘉宾生成、重连、总结均用 skeleton |

---

## 3. 拒绝的建议

| 建议 | 拒绝原因 |
|------|----------|
| "Video-First Hero" 页面模式 | 面向营销落地页，非广播演播厅应用。改为舞台焦点式布局。 |
| "Exaggerated Minimalism" 的 12rem 超大字体 | 演播厅场景需要信息密度，非纯视觉冲击。字号上限保留在 40px (`--text-3xl`)。 |
| Lexend + Source Sans 3 字体配对 | CJK 场景下中文字形回退到系统默认字体时，与 Lexend 风格不协调。选用 Inter + 系统 CJK 字体。 |
| `reactive()` 用于简单对象 | Vue 3 实际建议复杂对象用 `reactive()`，简单对象可用 `ref()`。本项目多数 Store 状态为数组/嵌套对象，使用 `reactive()` 合理。 |
| 绿色 CTA 按钮 `#22C55E` 作为主按钮色 | 保留为 Success 语义色。演播厅主操作不使用高亮绿（会与共识颜色冲突），改为次按钮风格。 |
| "Photography Studio" 纯黑背景 (#000000) | 对比度过高导致眼部疲劳。选用 #0B0B14（极深蓝灰），保留视觉舒适度。 |

---

## 4. SDD 约束与 UI UX Pro Max 冲突处理

| 冲突 | 处理 |
|------|------|
| UI UX Pro Max 未定义 10 色嘉宾色板 | **SDD 优先**。采用 `04-llm-protocol.md` §3.5 的 10 色色板，仅将颜色值同步至 CSS 变量。 |
| UI UX Pro Max 推荐亮色/暗色双主题 | **SDD 优先**。SDD 决策暗色单主题，设计系统不生成亮色变量。 |
| UI UX Pro Max 推荐主色 Indigo `#1E1B4B` | **DDD 调整**。保留深蓝紫方向但微调深度以适配演播厅暗色场景。 |
| Style 推荐 "Exaggerated Minimalism" | **DDD 定向裁剪**。保留"极简、高对比度"的克制感，移除"超大字体、massive whitespace"等营销页特征的过度表达。 |
| UI UX Pro Max button 规范使用彩色 CTA | **DDD 调整**。演播厅主操作避免高饱和度色（与会共识/状态色冲突），采用 neutral 按钮风格。 |

---

## 5. 最终设计决策总结

1. **暗色单主题** — 深蓝灰基调 `#0B0B14`，无亮色切换
2. **舞台焦点式布局** — 嘉宾阵列固定高度 + 发言区居中大字 + 双栏独立滚动
3. **Inter + 系统 CJK 字体** — 西文精致 + 中文原生渲染
4. **10 色嘉宾身份色板 + 4 色系统状态色 + 2 色共识/分歧色** — 三套色系严格分离
5. **克制动画** — 仅状态过渡 + 入场 stagger + 焦点转移，禁用装饰性动画
6. **Pinia 状态管理** — 3 个 Store（discussionList / discussion / webSocket）
7. **状态驱动路由** — 单一 `/discussions/:id` 路由 + DiscussionStatus 枚举驱动视图切换
8. **多重状态编码** — 颜色 + 图标 + 文字，满足可访问性要求
