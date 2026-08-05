// DDD §07-component-architecture.md §3.2 — 当前讨论 Store（核心 Store）
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Discussion, Panelist, Message, ConsensusPoint } from '@/types/domain'
import { DiscussionStatus } from '@/types/enums'
import type { WsPanelistStatus, WsConsensusUpdate } from '@/types/websocket'
import * as api from '@/api/endpoints'

export const useDiscussionStore = defineStore('discussion', () => {
  const discussion = ref<Discussion | null>(null)
  const panelists = ref<Panelist[]>([])
  const messages = ref<Message[]>([])
  const consensusPoints = ref<ConsensusPoint[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // ── 派生 ────────────────────────────────
  const host = computed(() => panelists.value.find((p) => p.role === 'HOST'))
  const experts = computed(() => panelists.value.filter((p) => p.role === 'EXPERT'))
  const currentSpeaker = computed(() => panelists.value.find((p) => p.status === 'SPEAKING'))

  // ── REST Actions ────────────────────────
  async function fetchDiscussion(id: string) {
    loading.value = true
    error.value = null
    try {
      const res = await api.fetchDiscussion(id)
      discussion.value = res.data
      panelists.value = res.data.panelists
      messages.value = res.data.latest_messages
      consensusPoints.value = res.data.consensus_points
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载讨论失败'
    } finally {
      loading.value = false
    }
  }

  async function generatePanel() {
    if (!discussion.value) return
    try {
      const res = await api.generatePanel(discussion.value.id)
      panelists.value = [res.data.host, ...res.data.experts]
      discussion.value.status = DiscussionStatus.PANEL_READY
    } catch (e) {
      error.value = e instanceof Error ? e.message : '生成嘉宾失败'
      throw e
    }
  }

  async function replaceExpert(panelistId: string) {
    if (!discussion.value) return
    try {
      const res = await api.replaceExpert(discussion.value.id, panelistId)
      const idx = panelists.value.findIndex((p) => p.id === panelistId)
      if (idx !== -1) panelists.value[idx] = res.data
    } catch (e) {
      error.value = e instanceof Error ? e.message : '替换专家失败'
      throw e
    }
  }

  async function regenerateAll() {
    if (!discussion.value) return
    discussion.value.status = DiscussionStatus.PENDING_PANEL
    try {
      const res = await api.regeneratePanel(discussion.value.id)
      panelists.value = [res.data.host, ...res.data.experts]
      discussion.value.status = DiscussionStatus.PANEL_READY
    } catch (e) {
      discussion.value.status = DiscussionStatus.PANEL_READY // 失败时恢复
      error.value = e instanceof Error ? e.message : '重新生成失败'
      throw e
    }
  }

  async function start() {
    if (!discussion.value) return
    try {
      const res = await api.startDiscussion(discussion.value.id)
      discussion.value.status = DiscussionStatus.IN_PROGRESS
      return res.data
    } catch (e) {
      error.value = e instanceof Error ? e.message : '开始讨论失败'
      throw e
    }
  }

  async function end() {
    if (!discussion.value) return
    try {
      const res = await api.endDiscussion(discussion.value.id)
      discussion.value.status = DiscussionStatus.ENDED
      return res.data.summary
    } catch (e) {
      error.value = e instanceof Error ? e.message : '结束讨论失败'
      throw e
    }
  }

  // ── WebSocket 事件处理 ──────────────────
  function handlePanelistStatus(data: WsPanelistStatus) {
    for (const update of data.panelists) {
      const p = panelists.value.find((p) => p.id === update.id)
      if (p) {
        p.status = update.status
        p.current_focus = update.current_focus
      }
    }
  }

  function handleNewMessage(message: Message) {
    messages.value.push(message)
  }

  function handleConsensusUpdate(data: WsConsensusUpdate) {
    consensusPoints.value = data.points
  }

  function handleDiscussionEnded() {
    if (discussion.value) {
      discussion.value.status = DiscussionStatus.ENDED
    }
  }

  function reset() {
    discussion.value = null
    panelists.value = []
    messages.value = []
    consensusPoints.value = []
    error.value = null
  }

  return {
    discussion,
    panelists,
    messages,
    consensusPoints,
    loading,
    error,
    host,
    experts,
    currentSpeaker,
    fetchDiscussion,
    generatePanel,
    replaceExpert,
    regenerateAll,
    start,
    end,
    handlePanelistStatus,
    handleNewMessage,
    handleConsensusUpdate,
    handleDiscussionEnded,
    reset,
  }
})
