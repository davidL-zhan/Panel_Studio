<!-- DDD §06-page-layout §4 — 讨论详情顶栏 -->
<script setup lang="ts">
import { ArrowLeft, Square } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { DiscussionStatus, WsConnectionStatus } from '@/types/enums'
import type { Discussion } from '@/types/domain'
import WsConnectionIndicator from './WsConnectionIndicator.vue'

const props = defineProps<{
  discussion: Discussion
  wsStatus: WsConnectionStatus
  ending?: boolean
}>()

const emit = defineEmits<{ end: [] }>()

const router = useRouter()
const isInProgress = props.discussion.status === DiscussionStatus.IN_PROGRESS
const isEnded = props.discussion.status === DiscussionStatus.ENDED
</script>

<template>
  <header class="topbar">
    <button class="back-btn" @click="router.push('/')" aria-label="返回首页">
      <ArrowLeft :size="18" />
    </button>

    <div class="topic-area">
      <h1 class="topic-text">{{ discussion.topic }}</h1>
      <div class="meta-row">
        <span v-if="isEnded" class="status-tag ended">ENDED</span>
        <span class="expert-count">{{ discussion.expert_count }} 位专家</span>
      </div>
    </div>

    <div class="right-area">
      <WsConnectionIndicator
        v-if="isInProgress"
        :status="wsStatus"
      />
      <button
        v-if="isInProgress"
        class="end-btn"
        :disabled="ending"
        @click="emit('end')"
      >
        <Square :size="14" />
        {{ ending ? '结束中...' : '结束讨论' }}
      </button>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  height: 56px;
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: 0 var(--space-lg);
  background: var(--bg-surface-1);
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
}
.back-btn {
  width: 36px; height: 36px;
  display: flex; align-items: center; justify-content: center;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  transition: all var(--duration-fast);
  flex-shrink: 0;
}
.back-btn:hover { background: var(--bg-surface-2); color: var(--text-primary); }
.topic-area { flex: 1; min-width: 0; }
.topic-text {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.meta-row {
  display: flex; align-items: center; gap: var(--space-sm);
  margin-top: 2px;
}
.status-tag {
  font-size: 11px; font-weight: var(--font-semibold);
  padding: 1px 6px; border-radius: var(--radius-sm);
}
.status-tag.ended { background: var(--bg-surface-3); color: var(--text-secondary); }
.expert-count { font-size: var(--text-xs); color: var(--text-tertiary); }
.right-area {
  display: flex; align-items: center; gap: var(--space-md);
  flex-shrink: 0;
}
.end-btn {
  display: flex; align-items: center; gap: var(--space-xs);
  height: 32px; padding: 0 var(--space-md);
  border-radius: var(--radius-md);
  background: var(--color-error);
  color: #fff;
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  transition: all var(--duration-fast);
}
.end-btn:hover:not(:disabled) { filter: brightness(1.1); }
.end-btn:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
