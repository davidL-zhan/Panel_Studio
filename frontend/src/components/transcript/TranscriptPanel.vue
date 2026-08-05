<!-- DDD §07-component-architecture §2.6 — Transcript 面板
  独立滚动 · 自动追随 · 手动上滚暂停 · ScrollToBottomButton -->
<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import type { Message } from '@/types/domain'
import { TRANSCRIPT } from '@/constants/design-tokens'
import TranscriptMessage from './TranscriptMessage.vue'
import ScrollToBottomButton from '@/components/shared/ScrollToBottomButton.vue'

const props = defineProps<{ messages: Message[] }>()

const panelRef = ref<HTMLElement | null>(null)
const isAtBottom = ref(true)

const messages = computed(() => props.messages)

watch(() => props.messages.length, async () => {
  if (isAtBottom.value) {
    await nextTick()
    scrollToBottom()
  }
})

function handleScroll() {
  if (!panelRef.value) return
  const { scrollTop, scrollHeight, clientHeight } = panelRef.value
  isAtBottom.value = (scrollHeight - scrollTop - clientHeight) < TRANSCRIPT.autoScrollThreshold
}

function scrollToBottom() {
  if (panelRef.value) {
    panelRef.value.scrollTop = panelRef.value.scrollHeight
    isAtBottom.value = true
  }
}
</script>

<template>
  <div class="transcript-panel" ref="panelRef" @scroll="handleScroll" role="log" aria-live="polite" aria-label="Transcript">
    <h3 class="panel-title">Transcript</h3>
    <div v-if="messages.length === 0" class="empty">暂无发言记录</div>
    <div v-else class="msg-list">
      <TranscriptMessage
        v-for="(msg, i) in messages"
        :key="msg.id"
        :message="msg"
        :is-latest="i === messages.length - 1"
      />
    </div>
    <ScrollToBottomButton v-if="!isAtBottom" @click="scrollToBottom" />
  </div>
</template>

<style scoped>
.transcript-panel {
  position: relative;
  height: 100%;
  overflow-y: auto;
  padding: var(--space-md);
  background: var(--bg-surface-1);
  border-radius: var(--radius-lg);
}
.panel-title {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--space-sm);
  position: sticky; top: 0;
  background: var(--bg-surface-1);
  padding-bottom: var(--space-xs);
  z-index: 1;
}
.empty {
  color: var(--text-tertiary);
  font-size: var(--text-sm);
  text-align: center;
  padding: var(--space-xl);
}
.msg-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
</style>
