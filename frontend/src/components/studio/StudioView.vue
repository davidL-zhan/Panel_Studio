<!-- DDD §06-page-layout §4 — 演播厅 · DDD §09-responsive-design §4 -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useDiscussionStore } from '@/stores/discussion'
import { useWebSocketStore } from '@/stores/websocket'
import { WsConnectionStatus } from '@/types/enums'
import type { WsEnvelope, WsPanelistStatus, WsConsensusUpdate, WsInitialState } from '@/types/websocket'
import type { Message } from '@/types/domain'
import { MockWsServer } from '@/mocks/ws-server'
import { useMediaQuery } from '@/composables/useMediaQuery'
import StageArea from './StageArea.vue'
import CurrentSpeechBanner from './CurrentSpeechBanner.vue'
import ConsensusPanel from '@/components/consensus/ConsensusPanel.vue'
import TranscriptPanel from '@/components/transcript/TranscriptPanel.vue'

const discussionStore = useDiscussionStore()
const wsStore = useWebSocketStore()
const { isTablet, isMobile } = useMediaQuery()

const mockWs = new MockWsServer()
const currentMessage = ref(discussionStore.messages.at(-1) ?? null)
const activeTab = ref<'consensus' | 'transcript'>('transcript')

onMounted(() => {
  wsStore.status = WsConnectionStatus.CONNECTING
  setTimeout(() => {
    wsStore.status = WsConnectionStatus.CONNECTED
    startSimulation()
  }, 500)
})

onUnmounted(() => {
  mockWs.disconnect()
  wsStore.disconnect()
})

function startSimulation() {
  mockWs.connect(handleWsEvent)
  mockWs.setup(discussionStore.panelists, discussionStore.messages, discussionStore.consensusPoints)
  mockWs.start()
}

function handleWsEvent(envelope: WsEnvelope) {
  wsStore.lastSequenceId = envelope.sequence_id
  const data = envelope.data
  switch (envelope.event) {
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
    case 'initial_state':
      if (discussionStore.panelists.length === 0) {
        discussionStore.panelists = (data as WsInitialState).panelists
      }
      break
  }
}

defineExpose({
  endDiscussion() {
    mockWs.end()
    discussionStore.discussion!.status = 'ENDED' as any
  },
})
</script>

<template>
  <div class="studio-view">
    <!-- 舞台区 -->
    <StageArea :host="discussionStore.host" :experts="discussionStore.experts" />

    <!-- 当前发言 (aria-live 屏幕阅读器播报) -->
    <div role="status" aria-live="polite" aria-atomic="true">
      <CurrentSpeechBanner :message="currentMessage" />
    </div>

    <!-- 桌面：双栏；平板/手机：Tab 切换 -->
    <div class="dual-panel" v-if="!isTablet && !isMobile">
      <ConsensusPanel :points="discussionStore.consensusPoints" />
      <TranscriptPanel :messages="discussionStore.messages" />
    </div>

    <div class="tab-panel" v-else>
      <div class="tab-bar" role="tablist">
        <button
          role="tab"
          :aria-selected="activeTab === 'transcript'"
          class="tab-btn"
          :class="{ active: activeTab === 'transcript' }"
          @click="activeTab = 'transcript'"
        >Transcript</button>
        <button
          role="tab"
          :aria-selected="activeTab === 'consensus'"
          class="tab-btn"
          :class="{ active: activeTab === 'consensus' }"
          @click="activeTab = 'consensus'"
        >共识与分歧</button>
      </div>
      <div class="tab-content" role="tabpanel">
        <ConsensusPanel v-if="activeTab === 'consensus'" :points="discussionStore.consensusPoints" />
        <TranscriptPanel v-if="activeTab === 'transcript'" :messages="discussionStore.messages" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.studio-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.dual-panel {
  display: grid;
  grid-template-columns: 35fr 65fr;
  gap: var(--space-md);
  flex: 1;
  min-height: 0;
  padding: 0 var(--space-lg) var(--space-md);
}

/* Tab 模式 (平板/手机) */
.tab-panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 0 var(--space-md) var(--space-md);
}
.tab-bar {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: var(--space-sm);
  flex-shrink: 0;
}
.tab-btn {
  padding: var(--space-sm) var(--space-md);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-tertiary);
  border-bottom: 2px solid transparent;
  transition: all var(--duration-fast);
}
.tab-btn.active {
  color: var(--text-primary);
  border-bottom-color: var(--color-info);
}
.tab-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
</style>
