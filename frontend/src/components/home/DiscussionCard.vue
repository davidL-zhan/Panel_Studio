<!-- DDD §02-information-architecture.md §4.1 — 讨论列表卡片 -->
<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Users, Play, Eye, CheckCircle } from 'lucide-vue-next'
import { DiscussionStatus } from '@/types/enums'
import type { Discussion } from '@/types/domain'

const props = defineProps<{ discussion: Discussion }>()
const router = useRouter()

const statusLabel = computed(() => ({
  [DiscussionStatus.PENDING_PANEL]: '待生成',
  [DiscussionStatus.PANEL_READY]: '待确认',
  [DiscussionStatus.IN_PROGRESS]: '进行中',
  [DiscussionStatus.ENDED]: '已结束',
}[props.discussion.status]))

const statusIcon = computed(() => {
  switch (props.discussion.status) {
    case DiscussionStatus.IN_PROGRESS: return Play
    case DiscussionStatus.ENDED: return CheckCircle
    default: return Eye
  }
})

const timeAgo = computed(() => {
  const diff = Date.now() - new Date(props.discussion.created_at).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins} 分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} 小时前`
  return `${Math.floor(hours / 24)} 天前`
})

function goTo() {
  router.push({ name: 'discussion', params: { id: props.discussion.id } })
}
</script>

<template>
  <button class="discussion-card" @click="goTo">
    <div class="card-left">
      <h3 class="card-topic">{{ discussion.topic }}</h3>
      <div class="card-meta">
        <span class="meta-tag" :class="`status-${discussion.status.toLowerCase()}`">
          <component :is="statusIcon" :size="12" />
          {{ statusLabel }}
        </span>
        <span class="meta-info">
          <Users :size="12" />
          {{ discussion.expert_count }} 位专家
        </span>
        <span class="meta-time">{{ timeAgo }}</span>
      </div>
    </div>
    <div class="card-right">
      <span class="card-arrow">&rarr;</span>
    </div>
  </button>
</template>

<style scoped>
.discussion-card {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) var(--space-lg);
  background: var(--bg-surface-1);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  cursor: pointer;
  text-align: left;
  transition: all var(--duration-fast) var(--ease-out);
}
.discussion-card:hover {
  background: var(--bg-surface-2);
  border-color: var(--border-default);
}
.card-left { flex: 1; min-width: 0; }
.card-topic {
  font-size: var(--text-base);
  font-weight: var(--font-medium);
  margin-bottom: var(--space-xs);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-meta {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}
.meta-tag, .meta-info {
  display: flex;
  align-items: center;
  gap: 4px;
}
.status-pending_panel { color: var(--text-tertiary); }
.status-panel_ready { color: var(--color-info); }
.status-in_progress { color: var(--color-success); }
.status-ended { color: var(--text-secondary); }
.card-arrow {
  font-size: var(--text-lg);
  color: var(--text-tertiary);
  transition: transform var(--duration-fast);
}
.discussion-card:hover .card-arrow { transform: translateX(4px); }
</style>
