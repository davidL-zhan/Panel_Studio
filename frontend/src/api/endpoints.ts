// SDD §02-api-contract — 所有 REST 端点调用函数
// 职责边界：仅封装 HTTP 调用，不做业务逻辑，不操作 Store
import client from './client'
import type {
  DiscussionListResponse,
  CreateDiscussionRequest,
  CreateDiscussionResponse,
  DiscussionDetailResponse,
  PanelGenerateResponse,
  StartDiscussionResponse,
  EndDiscussionResponse,
  TranscriptResponse,
} from '@/types/api'
import type { Panelist, ConsensusPoint } from '@/types/domain'

// ── 讨论管理 ────────────────────────────────────

export function fetchDiscussions() {
  return client.get<DiscussionListResponse>('/api/discussions')
}

export function createDiscussion(data: CreateDiscussionRequest) {
  return client.post<CreateDiscussionResponse>('/api/discussions', data)
}

export function fetchDiscussion(id: string) {
  return client.get<DiscussionDetailResponse>(`/api/discussions/${id}`)
}

export function deleteDiscussion(id: string) {
  return client.delete(`/api/discussions/${id}`)
}

// ── 嘉宾管理 ────────────────────────────────────

export function generatePanel(id: string) {
  return client.post<PanelGenerateResponse>(`/api/discussions/${id}/panel/generate`)
}

export function fetchPanel(id: string) {
  return client.get<PanelGenerateResponse>(`/api/discussions/${id}/panel`)
}

export function replaceExpert(discussionId: string, panelistId: string) {
  return client.put<Panelist>(`/api/discussions/${discussionId}/panel/${panelistId}`)
}

export function regeneratePanel(id: string) {
  return client.post<PanelGenerateResponse>(`/api/discussions/${id}/panel/regenerate`)
}

// ── 讨论控制 ────────────────────────────────────

export function startDiscussion(id: string) {
  return client.post<StartDiscussionResponse>(`/api/discussions/${id}/start`)
}

export function endDiscussion(id: string) {
  return client.post<EndDiscussionResponse>(`/api/discussions/${id}/end`)
}

// ── 数据查询 ────────────────────────────────────

export function fetchTranscript(id: string, offset = 0, limit = 50) {
  return client.get<TranscriptResponse>(`/api/discussions/${id}/transcript`, {
    params: { offset, limit },
  })
}

export function fetchConsensus(id: string) {
  return client.get<ConsensusPoint[]>(`/api/discussions/${id}/consensus`)
}
