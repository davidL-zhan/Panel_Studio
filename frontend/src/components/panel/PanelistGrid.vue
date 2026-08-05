<!-- DDD §07-component-architecture.md §2.3 — 嘉宾网格 -->
<script setup lang="ts">
import type { Panelist } from '@/types/domain'
import ExpertCard from './ExpertCard.vue'

defineProps<{
  experts: Panelist[]
  showReplace?: boolean
  replacingId?: string | null
}>()

const emit = defineEmits<{ replace: [panelistId: string] }>()
</script>

<template>
  <div class="expert-grid" :class="`count-${experts.length}`">
    <ExpertCard
      v-for="expert in experts"
      :key="expert.id"
      :panelist="expert"
      :show-replace="showReplace"
      :replacing="replacingId === expert.id"
      @replace="emit('replace', expert.id)"
    />
  </div>
</template>

<style scoped>
.expert-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-lg);
}
/* 5 位专家：上 3 + 下 2 居中 (DDD §09-responsive-design §3.2) */
.count-5 {
  max-width: 720px;
  margin: 0 auto;
}
</style>
