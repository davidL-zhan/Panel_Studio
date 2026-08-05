// DDD §05-design-system.md — TypeScript 常量（仅需运行时动态引用的部分）
// 样式值以 CSS variables.css 为准，此处用作 JS 侧引用

export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1440,
} as const

export const TRANSCRIPT = {
  autoScrollThreshold: 50,    // px — 距底多少视为"在底部" (Q5 决策)
  pageSize: 50,               // ENDED 态分页大小
} as const

export const WS = {
  reconnectDelays: [1000, 2000, 4000], // ms — 指数退避 (DDD §08-interaction-specification §3.2)
  maxReconnectAttempts: 3,
  heartbeatInterval: 15000,   // ms
  zombieTimeout: 30000,       // ms — 30s 无事件标记僵尸 (Q9 决策)
  maxMissedBeforeReset: 200,  // 遗漏超过此数请求全量刷新
} as const

export const TOAST = {
  maxStack: 3,                // 最多堆叠条数 (Q10 决策)
  duration: 3000,             // ms — 自动消失时间
} as const

export const DISCUSSION = {
  minExperts: 4,
  maxExperts: 8,
  defaultExperts: 4,
  maxTopicLength: 200,
} as const

export const LAYOUT = {
  topbarHeight: 56,           // px
} as const
