// DDD §05-design-system.md §1.4 — 嘉宾身份色板 (SDD §04-llm-protocol §3.5)
// 前端分配，运行时动态绑定颜色

export const PANELIST_COLORS = [
  '#FF6B6B', //  0  珊瑚红
  '#4ECDC4', //  1  青绿 — 主持人专用
  '#45B7D1', //  2  天蓝
  '#96CEB4', //  3  薄荷绿
  '#FFEAA7', //  4  暖黄
  '#DDA0DD', //  5  梅紫
  '#98D8C8', //  6  浅绿松石
  '#F7DC6F', //  7  金盏黄
  '#E17055', //  8  陶土橙
  '#6C5CE7', //  9  薰衣草紫
] as const

export const HOST_COLOR = PANELIST_COLORS[1] // #4ECDC4

/** DDD §04-llm-protocol §3.6 — 色板分配算法 */
export function assignColors(expertsCount: number): string[] {
  const expertPool = PANELIST_COLORS.filter((_, i) => i !== 1) // exclude HOST_COLOR
  return Array.from({ length: expertsCount }, (_, i) => expertPool[i % expertPool.length])
}
