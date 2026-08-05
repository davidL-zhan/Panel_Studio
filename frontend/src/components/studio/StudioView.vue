<!-- DDD §06-page-layout §4 — 演播厅 · 实时 WebSocket 事件驱动 -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useDiscussionStore } from '@/stores/discussion'
import { useWebSocketStore } from '@/stores/websocket'
import { WsConnectionStatus } from '@/types/enums'
import type { WsEnvelope, WsPanelistStatus, WsConsensusUpdate, WsInitialState } from '@/types/websocket'
import type { Message } from '@/types/domain'
import { MockWsServer } from '@/mocks/ws-server'
import { useMediaQuery } from '@/composables/useMediaQuery'
import * as api from '@/api/endpoints'
import StageArea from './StageArea.vue'
import CurrentSpeechBanner from './CurrentSpeechBanner.vue'
import ConsensusPanel from '@/components/consensus/ConsensusPanel.vue'
import TranscriptPanel from '@/components/transcript/TranscriptPanel.vue'

const IS_MOCK = import.meta.env.VITE_MOCK === 'true'

const discussionStore = useDiscussionStore()
const wsStore = useWebSocketStore()
const { isTablet, isMobile } = useMediaQuery()

const mockWs = IS_MOCK ? new MockWsServer() : null
const currentMessage = ref<Message | null>(discussionStore.messages.at(-1) ?? null)
const activeTab = ref<'consensus' | 'transcript'>('transcript')

onMounted(async () => {
  if (!discussionStore.discussion) return
  const discId = discussionStore.discussion.id

  // 拉取完整 Transcript（不仅限 20 条）
  try {
    const res = await api.fetchTranscript(discId, 0, 500)
    discussionStore.messages = res.data.messages
  } catch { /* 使用初始加载的数据 */ }

  if (IS_MOCK) {
    // Mock 模式
    wsStore.status = WsConnectionStatus.CONNECTING
    setTimeout(() => {
      wsStore.status = WsConnectionStatus.CONNECTED
      mockWs!.connect(handleWsEvent)
      mockWs!.setup(discussionStore.panelists, discussionStore.messages, discussionStore.consensusPoints)
      mockWs!.start()
    }, 500)
  } else {
    // 真实 WebSocket 模式
    wsStore.setEventHandler(handleWsEvent)
    wsStore.connect(discId)
  }
})

onUnmounted(() => {
  mockWs?.disconnect()
  wsStore.disconnect()
})

// 统一事件处理（Mock 和真实 WS 共用）
function handleWsEvent(envelope: WsEnvelope) {
  wsStore.lastSequenceId = envelope.sequence_id
  const data = envelope.data

  if (import.meta.env.DEV) {
    console.debug('[WS]', envelope.event, envelope.sequence_id)
  }

  switch (envelope.event) {
    case 'initial_state': {
      const d = data as WsInitialState
      if (d.latest_messages?.length) {
        discussionStore.messages = d.latest_messages
        currentMessage.value = d.latest_messages.at(-1) ?? null
      }
      break
    }
    case 'discussion_started':
      // engine confirmed running
      break
    case 'panelist_status':
      discussionStore.handlePanelistStatus(data as WsPanelistStatus)
      break
    case 'new_message': {
      const msg = (data as { message: Message }).message
      discussionStore.handleNewMessage(msg)
      currentMessage.value = msg
      break
    }
    case 'consensus_update':
      discussionStore.handleConsensusUpdate(data as WsConsensusUpdate)
      break
    case 'discussion_ended':
      discussionStore.handleDiscussionEnded()
      break
  }
}

defineExpose({
  endDiscussion() {
    if (IS_MOCK) {
      mockWs?.end()
    }
    if (discussionStore.discussion) {
      discussionStore.discussion.status = 'ENDED' as any
    }
  },
})
</script>

<template>
  <div class="studio-view">
    <!-- WS 连接状态 -->
    <div v-if="!IS_MOCK && wsStore.status !== WsConnectionStatus.CONNECTED" class="ws-banner" :class="wsStore.status">
      <span v-if="wsStore.status === WsConnectionStatus.CONNECTING">正在连接...</span>
      <span v-else-if="wsStore.status === WsConnectionStatus.RECONNECTING">连接断开，重连中...</span>
      <span v-else>连接失败，请刷新页面</span>
    </div>

    <StageArea :host="discussionStore.host" :experts="discussionStore.experts" />

    <div role="status" aria-live="polite" aria-atomic="true">
      <CurrentSpeechBanner :message="currentMessage" />
    </div>

    <div class="dual-panel" v-if="!isTablet && !isMobile">
      <ConsensusPanel :points="discussionStore.consensusPoints" />
      <TranscriptPanel :messages="discussionStore.messages" />
    </div>

    <div class="tab-panel" v-else>
      <div class="tab-bar" role="tablist">
        <button role="tab" :aria-selected="activeTab === 'transcript'" class="tab-btn"
                :class="{ active: activeTab === 'transcript' }" @click="activeTab = 'transcript'">Transcript</button>
        <button role="tab" :aria-selected="activeTab === 'consensus'" class="tab-btn"
                :class="{ active: activeTab === 'consensus' }" @click="activeTab = 'consensus'">共识与分歧</button>
      </div>
      <div class="tab-content" role="tabpanel">
        <ConsensusPanel v-if="activeTab === 'consensus'" :points="discussionStore.consensusPoints" />
        <TranscriptPanel v-if="activeTab === 'transcript'" :messages="discussionStore.messages" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.studio-view { height: 100%; display: flex; flex-direction: column; overflow: hidden; }
.ws-banner {
  text-align: center; padding: var(--space-xs) var(--space-md); font-size: var(--text-xs);
  background: var(--bg-surface-2); flex-shrink: 0;
}
.ws-banner.connecting,
.ws-banner.reconnecting { color: var(--color-warning); }
.ws-banner.disconnected { color: var(--color-error); }
.dual-panel {
  display: grid; grid-template-columns: 35fr 65fr; gap: var(--space-md);
  flex: 1; min-height: 0; padding: 0 var(--space-lg) var(--space-md);
}
.tab-panel { flex: 1; min-height: 0; display: flex; flex-direction: column; padding: 0 var(--space-md) var(--space-md); }
.tab-bar { display: flex; border-bottom: 1px solid var(--border-subtle); margin-bottom: var(--space-sm); flex-shrink: 0; }
.tab-btn {
  padding: var(--space-sm) var(--space-md); font-size: var(--text-sm); font-weight: var(--font-medium);
  color: var(--text-tertiary); border-bottom: 2px solid transparent; transition: all var(--duration-fast);
}
.tab-btn.active { color: var(--text-primary); border-bottom-color: var(--color-info); }
.tab-content { flex: 1; min-height: 0; overflow: hidden; }
</style>
