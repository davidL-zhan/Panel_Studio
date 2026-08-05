// SDD §02-api-contract — REST API 请求/响应 DTO

import type { Discussion, Panelist, Message, ConsensusPoint } from './domain'
import type { DiscussionStatus } from './enums'

// ── GET /api/discussions ──────────────────────────
export type DiscussionListResponse = Pick<
  Discussion,
  'id' | 'topic' | 'expert_count' | 'status' | 'created_at' | 'updated_at'
>[]

// ── POST /api/discussions ─────────────────────────
export interface CreateDiscussionRequest {
  topic: string
  expert_count?: number // default 4, range [4, 8]
}

export interface CreateDiscussionResponse extends Discussion {}

// ── GET /api/discussions/:id ──────────────────────
export interface DiscussionDetailResponse extends Discussion {
  panelists: Panelist[]
  latest_messages: Message[]
  consensus_points: ConsensusPoint[]
}

// ── POST /api/discussions/:id/panel/generate ──────
export interface PanelGenerateResponse {
  host: Panelist
  experts: Panelist[]
}

// ── PUT /api/discussions/:id/panel/:pid ───────────
// 请求体为空（后端自动调用 LLM）

// ── POST /api/discussions/:id/start ───────────────
export interface StartDiscussionResponse {
  status: DiscussionStatus
  message: string
}

// ── POST /api/discussions/:id/end ─────────────────
export interface EndDiscussionResponse {
  status: DiscussionStatus
  summary: string
}

// ── GET /api/discussions/:id/transcript ───────────
export interface TranscriptResponse {
  total: number
  messages: Message[]
}

// ── 通用错误 ──────────────────────────────────────
export interface ApiErrorResponse {
  detail: string | Array<{ loc: string[]; msg: string; type: string }>
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string,
  ) {
    super(`[${status}] ${detail}`)
    this.name = 'ApiError'
  }
}
