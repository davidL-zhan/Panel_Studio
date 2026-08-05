// SDD §01-domain-model — 领域实体
// DDD 源头：07-component-architecture.md §3 Store 设计

import type { DiscussionStatus, PanelistRole, PanelistStatus, MessageType, ConsensusType } from './enums'

/** SDD §01-domain-model §1.1 */
export interface Discussion {
  id: string
  topic: string
  expert_count: number // 4–8, default 4
  status: DiscussionStatus
  created_at: string // ISO 8601
  updated_at: string
}

/** SDD §01-domain-model §1.2 — 嘉宾（含主持人） */
export interface Panelist {
  id: string
  discussion_id: string
  name: string
  role: PanelistRole
  profession: string
  title: string
  stance: string
  color: string // 前端分配 e.g. "#FF6B6B"
  status: PanelistStatus
  current_focus: string | null
  sort_order: number
}

/** SDD §01-domain-model §1.3 — 发言 / Transcript 条目 */
export interface Message {
  id: string
  discussion_id: string
  panelist_id: string
  panelist_name: string // API 衍生字段 (JOIN)
  panelist_title: string // API 衍生字段 (JOIN)
  panelist_color: string // API 衍生字段 (JOIN)
  content: string
  message_type: MessageType
  sequence: number
  created_at: string
}

/** SDD §01-domain-model §1.4 — 共识与分歧 */
export interface ConsensusPoint {
  id: string
  discussion_id: string
  point_type: ConsensusType
  content: string
  message_range_start: number | null
  message_range_end: number | null
  generated_at: string
}
