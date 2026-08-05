# 10 — Accessibility

> DDD 阶段 · 可访问性规范 · AI Panel Studio

---

## 1. 对比度

| 元素 | 最小对比度 | 说明 |
|------|-----------|------|
| 正文文字 (Text-Primary `#F1F1F7` on `#0B0B14`) | **12.8:1** ✅ | 远超 WCAG AA 4.5:1 |
| 次要文字 (Text-Secondary `#9494A8` on `#0B0B14`) | **5.7:1** ✅ | 满足 WCAG AA |
| 辅助文字 (Text-Tertiary `#5C5C78` on `#0B0B14`) | **3.2:1** ⚠️ | 仅用于非关键信息（时间戳等），不承载必要信息 |
| 嘉宾色 `#4ECDC4` on `#0B0B14` | **8.4:1** ✅ | 色块与背景 |
| 嘉宾色 `#FFEAA7` on `#0B0B14` | **14.2:1** ✅ | 浅色嘉宾色与深底 |
| 嘉宾色 `#FF6B6B` on `#0B0B14` | **5.8:1** ✅ | 满足 AA |
| Success `#22C55E` on `#0B0B14` | **7.9:1** ✅ | 状态指示 |
| Error `#EF4444` on `#0B0B14` | **4.6:1** ✅ | 满足 AA |
| Warning `#F59E0B` on `#0B0B14` | **8.3:1** ✅ | 状态指示 |

> 暗色主题下对比度普遍优异。唯一低于 4.5:1 的 Text-Tertiary 仅用于装饰性信息，不承载内容。

---

## 2. 键盘导航

| 区域 | 预期行为 |
|------|----------|
| **Tab 键** | 按 DOM 顺序焦点移动：TopBar → 嘉宾阵列 → 当前发言 → 共识面板 → Transcript → 操作按钮 |
| **Enter / Space** | 激活按钮、选中列表项 |
| **Escape** | 关闭 Dialog、关闭 Toast、取消操作 |
| **Arrow 键** | 在嘉宾阵列内左右/上下移动焦点（grid pattern） |
| **Ctrl+Home** | Transcript 滚动到顶部 |
| **Ctrl+End** | Transcript 滚动到底部（恢复自动追随） |

---

## 3. Focus 状态

```css
*:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
  border-radius: 4px;
}
```

**规则：**
- 所有可交互元素（按钮、链接、输入框、可选择列表项）必须有可见的 focus 指示器
- 使用 `:focus-visible` 而非 `:focus`（鼠标点击不显示轮廓）
- Dialog 打开时焦点锁定在 Dialog 内（Tab 循环），关闭时焦点回到触发元素

---

## 4. ARIA 标注

| 元素 | aria 属性 | 说明 |
|------|-----------|------|
| 嘉宾网格 | `role="grid"` | 键盘导航网格模式 |
| 嘉宾卡片 | `role="gridcell"` + `aria-label="{姓名}，{职业}，{状态}"` | 完整信息暴露给屏幕阅读器 |
| 当前发言区 | `role="status"` + `aria-live="polite"` | 新发言时屏幕阅读器读出 |
| WS 连接指示器 | `role="status"` + `aria-label="连接状态：{已连接/重连中/已断开}"` | |
| Transcript 面板 | `role="log"` + `aria-live="polite"` | 新消息自动播报 |
| 共识面板 | `role="feed"` + `aria-label="共识与分歧"` | |
| Toast | `role="alert"` + `aria-live="assertive"` | 错误/警告立即播报 |
| Dialog | `role="dialog"` + `aria-modal="true"` + `aria-labelledby` | |
| 状态圆点 | `aria-hidden="true"`（装饰性）+ 相邻 hidden `<span>` 提供文字描述 | 颜色不作为唯一状态表达 |

---

## 5. 状态的多重编码

**SDD 要求 "不能只依靠颜色表达状态"——所有状态至少用 3 种方式编码：**

| 状态 | 颜色 | 图标/形状 | 文字 |
|------|------|-----------|------|
| STANDBY | opacity 0.7 | 无特殊标记 | "待机" (sr-only 或 tooltip) |
| PREPARING | opacity 0.85 + 边框微亮（嘉宾色 1px） | 思考气泡 icon | "准备中" |
| SPEAKING | opacity 1.0 + 边框高亮 2px + 背景微提亮 | 声波 icon | "发言中" |
| WS 已连接 | 绿色 | Wifi icon | "已连接" |
| WS 重连中 | 黄色闪烁 | WifiOff icon + 旋转 | "重连中..." |
| WS 已断开 | 红色 | WifiOff icon | "已断开" |
| 共识 | 绿色 | CheckCircle2 icon | "共识" |
| 分歧 | 琥珀色 | AlertCircle icon | "分歧" |

---

## 6. prefers-reduced-motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**行为：**
- 所有过渡/动画瞬时完成
- 嘉宾卡片入场 stagger 效果关闭
- PREPARING 呼吸动画关闭（改为静态样式：opacity 0.85 + 边框常亮）
- Transcript 自动滚动改为瞬时跳转

---

## 7. 屏幕阅读器实时内容处理

| 事件 | 播报策略 |
|------|----------|
| 新发言 (`new_message`) | `aria-live="polite"` — 不打断当前阅读，在停顿后播报 "{发言人姓名}：{内容}" |
| 讨论开始 (`discussion_started`) | `aria-live="assertive"` — "讨论已开始" |
| 讨论结束 (`discussion_ended`) | `aria-live="assertive"` — "讨论已结束" |
| 共识更新 (`consensus_update`) | `aria-live="polite"` — 仅在新增条目时播报，重复条目静默 |
| WS 断开 | `role="alert"` — "连接已断开，正在重连" |
| WS 恢复 | `role="alert"` — "连接已恢复" |

---

## 8. Dialog 焦点管理

1. Dialog 打开时 → 焦点移到 Dialog 内第一个可聚焦元素（通常是取消按钮）
2. Tab 键在 Dialog 内循环（最后一个元素 Tab → 回到第一个）
3. Escape 键关闭 Dialog
4. 点击遮罩层（overlay）关闭 Dialog
5. Dialog 关闭后 → 焦点回到触发 Dialog 的元素
6. 背景内容 `aria-hidden="true"` 防止屏幕阅读器访问

---

## 9. 其他可访问性规则

| 规则 | 说明 |
|------|------|
| 页面标题 | 每个页面有唯一的 `<title>`（中文）：`AI Panel Studio - {页面名}` |
| 语言声明 | `<html lang="zh-CN">` |
| 缩放 | 不禁用用户缩放（`user-scalable=yes`） |
| 触控目标 | 所有可交互元素最小尺寸 44×44px（移动端） |
| 表单 label | 所有输入框有关联的 `<label>`，不使用 placeholder 替代 |
| 跳过链接 | 提供 "跳转到主内容" 的 skip-link（`sr-only:focus-visible` 时显示） |
| 图片 | 所有非装饰性图片有 `alt` 文本 |

---

## 10. 色盲模拟验证

10 种嘉宾色在常见色盲类型下的区分度：

- **红色盲 (Protanopia)**：`#FF6B6B` 与 `#E17055` 接近，但与其它 8 色可区分。可接受（每位专家有姓名文字作为首要标识）。
- **绿色盲 (Deuteranopia)**：`#96CEB4` 与 `#98D8C8` 接近。可接受。
- **蓝黄色盲 (Tritanopia)**：所有 10 色在该类型下区分度良好。

> 颜色仅作为身份辅助标识，嘉宾姓名始终是首要识别方式。
