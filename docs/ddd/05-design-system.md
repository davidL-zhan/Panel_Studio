# 05 — Design System

> DDD 阶段 · 设计 Token 体系 · AI Panel Studio
>
> 基于 UI UX Pro Max 设计系统 + SDD 约束定制

---

## 1. 颜色 Token

### 1.1 基础色板（来自 UI UX Pro Max + 定制调整）

| Token | Hex | CSS Variable | 用途 |
|-------|-----|-------------|------|
| Background | `#0B0B14` | `--bg-root` | 页面根背景 |
| Surface-1 | `#111122` | `--bg-surface-1` | 卡片、面板背景 |
| Surface-2 | `#16162B` | `--bg-surface-2` | 提升层（hover、active card） |
| Surface-3 | `#1C1C38` | `--bg-surface-3` | 最高提升层（dialog overlay 下） |
| Text-Primary | `#F1F1F7` | `--text-primary` | 主要文字 |
| Text-Secondary | `#9494A8` | `--text-secondary` | 次要文字、辅助信息 |
| Text-Tertiary | `#5C5C78` | `--text-tertiary` | 禁用态、占位文字 |
| Border-Default | `#28284D` | `--border-default` | 默认边框 |
| Border-Subtle | `#1E1E3A` | `--border-subtle` | 微弱分割线 |
| Border-Focus | `#4E4E8A` | `--border-focus` | 聚焦边框 |

> 调整说明：UI UX Pro Max 原始色板（`#0F0F23` 背景, `#1E1B4B` 主色）经过深度和可读性优化——略微降低背景亮度提升对比度，扩展 Surface 层级以支持 3 级提升。

### 1.2 语义状态色（系统状态，不可用于嘉宾身份）

| Token | Hex | CSS Variable | 用途 |
|-------|-----|-------------|------|
| Success | `#22C55E` | `--color-success` | 操作成功、WS 已连接 |
| Warning | `#F59E0B` | `--color-warning` | 重连中、需要注意 |
| Error | `#EF4444` | `--color-error` | 错误、已断开、删除 |
| Info | `#3B82F6` | `--color-info` | 一般信息提示 |

### 1.3 共识与分歧语义色

| Token | Hex | CSS Variable | 用途 |
|-------|-----|-------------|------|
| Consensus | `#22C55E` | `--color-consensus` | 共识标记 |
| Disagreement | `#F59E0B` | `--color-disagreement` | 分歧标记 |

> 设计约束：共识/分歧不得使用 Success/Error 的语义（分歧 ≠ 错误），故分歧使用琥珀色而非红色。

### 1.4 嘉宾身份色板（SDD §04-llm-protocol §3.5）

```css
--color-panelist-0: #FF6B6B;  /* 珊瑚红 */
--color-panelist-1: #4ECDC4;  /* 青绿 — 主持人专用 */
--color-panelist-2: #45B7D1;  /* 天蓝 */
--color-panelist-3: #96CEB4;  /* 薄荷绿 */
--color-panelist-4: #FFEAA7;  /* 暖黄 */
--color-panelist-5: #DDA0DD;  /* 梅紫 */
--color-panelist-6: #98D8C8;  /* 浅绿松石 */
--color-panelist-7: #F7DC6F;  /* 金盏黄 */
--color-panelist-8: #E17055;  /* 陶土橙 */
--color-panelist-9: #6C5CE7;  /* 薰衣草紫 */
```

**使用规则：**
- 主持人固定 `--color-panelist-1`（#4ECDC4 青绿）
- 每位专家的色板索引在创建时确定，终身不变
- 嘉宾色**仅用于**：身份标识色块、Transcript 发言人头像色、当前发言人边框
- 嘉宾色**不得用于**：系统状态、错误提示、共识/分歧颜色

---

## 2. 字体层级

### 2.1 字体族

| 角色 | 字体 | 后备 |
|------|------|------|
| 中文正文 | PingFang SC, Microsoft YaHei | sans-serif |
| 西文/数字 | Inter | system-ui |
| UI 界面中文 | PingFang SC, Microsoft YaHei | sans-serif |

```css
--font-body: 'Inter', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
--font-display: 'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif;
```

> 选型理由：Inter 是 UI UX Pro Max 推荐，PingFang SC（Mac）/ Microsoft YaHei（Win）为中文高质量渲染的系统字体。Lexend + Source Sans 3 组合（UI UX Pro Max 搜索结果）在 CJK 场景下中文字形回退体验不佳，不采用。

### 2.2 字号层级

| Token | Size / Line-height | Weight | 用途 |
|-------|--------------------|--------|------|
| `--text-xs` | 12px / 1.5 | 400 | 辅助标签、时间戳 |
| `--text-sm` | 14px / 1.5 | 400 | Transcript 内容、共识文本 |
| `--text-base` | 16px / 1.6 | 400 | 正文、卡片内容 |
| `--text-lg` | 18px / 1.5 | 500 | 嘉宾姓名、小标题 |
| `--text-xl` | 24px / 1.4 | 600 | 当前发言内容 |
| `--text-2xl` | 32px / 1.3 | 700 | 页面标题、讨论话题 |
| `--text-3xl` | 40px / 1.2 | 700 | 首页 Hero 话题 |

---

## 3. 间距 Token

采用 UI UX Pro Max 标准间距体系（Density 4/10 — Standard）：

| Token | Value | 用途 |
|-------|-------|------|
| `--space-xs` | 4px | 图标与文字间隙、紧密元素 |
| `--space-sm` | 8px | 嘉宾卡片内边距、标签间距 |
| `--space-md` | 16px | 标准内边距、卡片间隙 |
| `--space-lg` | 24px | 区块内边距、嘉宾网格间隙 |
| `--space-xl` | 32px | 页面区块间距 |
| `--space-2xl` | 48px | 大区块间隔 |
| `--space-3xl` | 64px | 页面级 padding |

---

## 4. 圆角

| Token | Value | 用途 |
|-------|-------|------|
| `--radius-sm` | 4px | 小标签、badge、inline code |
| `--radius-md` | 8px | 按钮、输入框、嘉宾色块 |
| `--radius-lg` | 12px | 卡片、面板、Transcript 条目 |
| `--radius-xl` | 16px | 模态框 |
| `--radius-full` | 9999px | 状态圆点、头像色块 |

---

## 5. 阴影

仅在 Surface 层级使用阴影表达深度（暗色主题下阴影用透明度控制）：

| Token | Value | 用途 |
|-------|-------|------|
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.4)` | 轻微提升 |

<｜｜DSML｜｜parameter name="content" string="true">| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.5)` | 卡片、面板 |
| `--shadow-lg` | `0 8px 24px rgba(0,0,0,0.6)` | 模态框、对话框 |
| `--shadow-glow` | `0 0 20px rgba(78,205,196,0.15)` | 当前发言人聚光效果 |

---

## 6. 按钮规范

| Variant | 背景 | 文字 | 边框 | Hover | Disabled |
|---------|------|------|------|-------|----------|
| Primary | `--color-success` | `#0B0B14` | — | `brightness(1.1)` | `opacity: 0.4` |
| Secondary | transparent | `--text-primary` | `--border-default` | `bg-surface-2` | `opacity: 0.4` |
| Danger | `--color-error` | white | — | `brightness(1.1)` | `opacity: 0.4` |
| Ghost | transparent | `--text-secondary` | — | `bg-surface-2` | `opacity: 0.4` |

尺寸：`h-10` (40px) / `h-12` (48px 主按钮)，最小宽度 120px（主按钮）/ 80px（次按钮）。

---

## 7. 输入框规范

```css
.input {
  height: 48px;
  padding: 0 var(--space-md);
  background: var(--bg-surface-1);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-base);
  transition: border-color 200ms ease, box-shadow 200ms ease;
}
.input:focus {
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px rgba(78, 78, 138, 0.2);
  outline: none;
}
.input::placeholder {
  color: var(--text-tertiary);
}
```

---

## 8. 卡片规范（嘉宾卡片）

```css
.panelist-card {
  background: var(--bg-surface-1);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-md) var(--space-lg);
  min-width: 180px;
  transition: opacity 200ms ease, border-color 200ms ease, box-shadow 200ms ease;
}
.panelist-card[data-status="STANDBY"] { opacity: 0.7; }
.panelist-card[data-status="PREPARING"] {
  opacity: 0.85;
  border-color: var(--panelist-color);
  border-width: 1px;
}
.panelist-card[data-status="SPEAKING"] {
  opacity: 1.0;
  border-color: var(--panelist-color);
  border-width: 2px;
  background: color-mix(in srgb, var(--panelist-color) 8%, var(--bg-surface-1));
}
```

---

## 9. Dialog / Toast 规范

### Dialog（模态框）
- 背景：`--bg-surface-2` + `--shadow-lg`
- 遮罩：`rgba(0,0,0,0.6)` + `backdrop-filter: blur(4px)`
- 宽度：`max-width: 440px; width: 90vw`
- 按钮：主操作在右（Primary），取消在左（Secondary）

### Toast
- 位置：右上角，距顶 24px，距右 24px
- 动画：从右侧滑入 300ms ease-out，3s 后自动滑出
- 类型：success（绿）、warning（黄）、error（红）、info（蓝）

---

## 10. 动画规范

| 用途 | Duration | Easing | 说明 |
|------|----------|--------|------|
| 状态过渡（STANDBY↔PREPARING↔SPEAKING） | 150-300ms | ease-out / ease-in | 入场快退场慢，不抢注意力 |
| 嘉宾卡片 stagger 入场 | 300ms each, stagger 60ms | `back.out(1.4)` | UI UX Pro Max 推荐，仅首次加载 |
| 新发言内容区更新 | 200ms | ease-out | 内容 fade + slide-up 4px |
| Toast 出入 | 300ms | ease-out | 右滑入/右滑出 |
| 共识/分歧新增高亮 | 1s | ease-out | 背景色从高亮渐变到正常 |
| 所有动画 | — | — | `prefers-reduced-motion` 时全部禁用，瞬时切换 |

---

## 11. 图标

使用 **Lucide** 图标集（Vue 3 封装：`lucide-vue-next`）：

| 用途 | 图标 |
|------|------|
| 创建讨论 | `Plus` |
| 开始讨论 | `Play` |
| 结束讨论 | `Square`（停止）或 `Flag`（旗帜） |
| 删除 | `Trash2` |
| 替换专家 | `RefreshCw` |
| 全部重新生成 | `RotateCcw` |
| WS 已连接 | `Wifi`（绿） |
| WS 重连中 | `WifiOff`（黄） |
| WS 已断开 | `WifiOff`（红） |
| 共识 | `CheckCircle2` |
| 分歧 | `AlertCircle` |
| 回到底部 | `ArrowDown` |
| 错误重试 | `RefreshCw` |

所有图标统一 `size={18}`（按钮内）/ `size={14}`（行内），stroke-width 统一 2px。

---

## 12. 暗色主题唯一

本项目仅支持暗色主题。在上述 Token 体系下，所有组件天然适配暗色。**不实现亮色切换。**
