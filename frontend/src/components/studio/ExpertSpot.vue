<!-- DDD §07-component-architecture §2.4 — 演播厅专家小窗
  薄封装 ExpertCard · 添加 gridcell role + tabindex -->
<script setup lang="ts">
import type { Panelist } from '@/types/domain'
import ExpertCard from '@/components/panel/ExpertCard.vue'

defineProps<{ panelist: Panelist }>()
</script>

<template>
  <div tabindex="0" class="expert-cell">
    <ExpertCard :panelist="panelist" :show-replace="false" />
  </div>
</template>

<style scoped>
.expert-cell {
  outline: none;
  border-radius: var(--radius-lg);
}
.expert-cell:focus-visible {
  box-shadow: 0 0 0 2px var(--border-focus);
}
</style>
