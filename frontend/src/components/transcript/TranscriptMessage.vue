<!-- DDD §07-component-architecture §2.6 — 单条 Transcript 消息 -->
<script setup lang="ts">
import type { Message } from '@/types/domain'

defineProps<{ message: Message; isLatest: boolean }>()
</script>

<template>
  <div class="transcript-msg" :class="{ latest: isLatest }">
    <div class="msg-color" :style="{ background: message.panelist_color }" />
    <div class="msg-body">
      <div class="msg-header">
        <span class="msg-name">{{ message.panelist_name }}</span>
        <span class="msg-title">{{ message.panelist_title }}</span>
        <span class="msg-seq">#{{ message.sequence }}</span>
      </div>
      <p class="msg-content">{{ message.content }}</p>
    </div>
  </div>
</template>

<style scoped>
.transcript-msg {
  display: flex;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  transition: background var(--duration-fast);
}
.transcript-msg.latest { background: color-mix(in srgb, var(--color-info) 5%, transparent); }
.msg-color {
  width: 4px; min-height: 100%;
  border-radius: 2px;
  flex-shrink: 0;
  margin-top: 4px;
}
.msg-body { flex: 1; min-width: 0; }
.msg-header {
  display: flex; align-items: center; gap: var(--space-sm);
  margin-bottom: 2px;
}
.msg-name { font-size: var(--text-xs); font-weight: var(--font-semibold); }
.msg-title { font-size: var(--text-xs); color: var(--text-tertiary); }
.msg-seq { font-size: 10px; color: var(--text-tertiary); margin-left: auto; flex-shrink: 0; }
.msg-content {
  font-size: var(--text-sm);
  line-height: var(--leading-sm);
  color: var(--text-secondary);
}
</style>
