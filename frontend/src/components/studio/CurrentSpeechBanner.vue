<!-- DDD §06-page-layout §4 — 当前发言横幅 -->
<script setup lang="ts">
import type { Message } from '@/types/domain'

const props = defineProps<{ message: Message | null }>()
</script>

<template>
  <div class="speech-banner" v-if="props.message">
    <p class="speech-speaker">
      <span class="speaker-name">{{ props.message.panelist_name }}</span>
      <span class="speaker-title">{{ props.message.panelist_title }}</span>
    </p>
    <p class="speech-content">{{ props.message.content }}</p>
  </div>
  <div class="speech-banner empty" v-else>
    <p class="speech-content muted">等待开场...</p>
  </div>
</template>

<style scoped>
.speech-banner {
  text-align: center;
  padding: var(--space-md) var(--space-xl);
  min-height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.speech-banner.empty { opacity: 0.5; }
.speech-speaker {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-xs);
}
.speaker-name { font-weight: var(--font-semibold); color: var(--text-primary); }
.speaker-title { margin-left: var(--space-sm); }
.speech-content {
  font-size: var(--text-xl);
  font-weight: var(--font-medium);
  line-height: var(--leading-xl);
  max-width: 800px;
  margin: 0 auto;
}
.speech-content.muted { font-size: var(--text-base); color: var(--text-tertiary); }
</style>
