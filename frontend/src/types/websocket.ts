// SDD §02-api-contract §3 — WebSocket 事件协议
// DDD 源头：04-page-state-matrix.md §4

import type { DiscussionStatus, PanelistStatus } from './enums'
import type { Panelist, Message, ConsensusPoint } from './domain'

// ── 事件类型枚举 ──────────────────────────────────
export type WsEventType =
  | 'initial_state'
  | 'discussion_started'
  | 'panel_generated'
  | 'panelist_status'
  | 'new_message'
  | 'consensus_update'
  | 'discussion_ended'
  | 'discussion_deleted'
  | 'error'

// ── 事件信封 ──────────────────────────────────────
export interface WsEnvelope {
  event: WsEventType
  sequence_id: number
  data: WsEventPayload
  timestamp: string
}

// ── 判别联合（discriminated union） ───────────────
export type WsEventPayload =
  | WsInitialState
  | WsDiscussionStarted
  | WsPanelGenerated
  | WsPanelistStatus
  | WsNewMessage
  | WsConsensusUpdate
  | WsDiscussionEnded
  | WsDiscussionDeleted
  | WsError

export interface WsInitialState {
  discussion_status: DiscussionStatus
  latest_messages: Message[]
  consensus_points: ConsensusPoint[]
  panelists: Panelist[]
}

export interface WsDiscussionStarted {
  topic: string
  panelist_count: number
}

export interface WsPanelGenerated {
  host: Panelist
  experts: Panelist[]
}

export interface WsPanelistStatus {
  panelists: Array<{
    id: string
    status: PanelistStatus
    current_focus: string | null
  }>
}

export interface WsNewMessage {
  message: Message
}

export interface WsConsensusUpdate {
  points: ConsensusPoint[]
}

export interface WsDiscussionEnded {
  summary: string
  total_messages: number
}

export interface WsDiscussionDeleted {
  discussion_id: string
}

export interface WsError {
  message: string
  recoverable: boolean
}
