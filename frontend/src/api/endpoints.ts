// SDD §02-api-contract — 所有 REST 端点调用函数
// 职责边界：仅封装 HTTP 调用，不做业务逻辑，不操作 Store
// VITE_MOCK=true 时切换到 mock API（无需后端）
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

const IS_MOCK = import.meta.env.VITE_MOCK === 'true'

// ── 讨论管理 ────────────────────────────────────
export async function fetchDiscussions() {
  if (IS_MOCK) return (await import('@/mocks/api')).fetchDiscussions()
  return client.get<DiscussionListResponse>('/api/discussions')
}

export async function createDiscussion(data: CreateDiscussionRequest) {
  if (IS_MOCK) return (await import('@/mocks/api')).createDiscussion(data)
  return client.post<CreateDiscussionResponse>('/api/discussions', data)
}

export async function fetchDiscussion(id: string) {
  if (IS_MOCK) return (await import('@/mocks/api')).fetchDiscussion(id)
  return client.get<DiscussionDetailResponse>(`/api/discussions/${id}`)
}

export async function deleteDiscussion(id: string) {
  if (IS_MOCK) return (await import('@/mocks/api')).deleteDiscussion(id)
  return client.delete(`/api/discussions/${id}`)
}

// ── 嘉宾管理 ────────────────────────────────────
export async function generatePanel(id: string) {
  if (IS_MOCK) return (await import('@/mocks/api')).generatePanel(id)
  return client.post<PanelGenerateResponse>(`/api/discussions/${id}/panel/generate`)
}

export async function fetchPanel(id: string) {
  if (IS_MOCK) return (await import('@/mocks/api')).generatePanel(id) // mock fallback
  return client.get<PanelGenerateResponse>(`/api/discussions/${id}/panel`)
}

export async function replaceExpert(discussionId: string, panelistId: string) {
  if (IS_MOCK) return (await import('@/mocks/api')).replaceExpert(discussionId, panelistId)
  return client.put<Panelist>(`/api/discussions/${discussionId}/panel/${panelistId}`)
}

export async function regeneratePanel(id: string) {
  if (IS_MOCK) return (await import('@/mocks/api')).regeneratePanel(id)
  return client.post<PanelGenerateResponse>(`/api/discussions/${id}/panel/regenerate`)
}

// ── 讨论控制 ────────────────────────────────────
export async function startDiscussion(id: string) {
  if (IS_MOCK) return (await import('@/mocks/api')).startDiscussion(id)
  return client.post<StartDiscussionResponse>(`/api/discussions/${id}/start`)
}

export async function endDiscussion(id: string) {
  if (IS_MOCK) return (await import('@/mocks/api')).endDiscussion(id)
  return client.post<EndDiscussionResponse>(`/api/discussions/${id}/end`)
}

// ── 数据查询 ────────────────────────────────────
export async function fetchTranscript(id: string, offset = 0, limit = 50) {
  if (IS_MOCK) {
    const mod = await import('@/mocks/api')
    const msgs = mod.messagesMap[id] ?? []
    return { data: { total: msgs.length, messages: msgs.slice(offset, offset + limit) } }
  }
  return client.get<TranscriptResponse>(`/api/discussions/${id}/transcript`, {
    params: { offset, limit },
  })
}

export async function fetchConsensus(id: string) {
  if (IS_MOCK) {
    const mod = await import('@/mocks/api')
    return { data: mod.consensusMap[id] ?? [] }
  }
  return client.get<ConsensusPoint[]>(`/api/discussions/${id}/consensus`)
}
