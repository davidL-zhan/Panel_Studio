<!--
  DDD §04-page-state-matrix.md §2 — Skeleton 占位
  可配置行数和宽度
-->
<script setup lang="ts">
withDefaults(defineProps<{
  rows?: number
  width?: string
}>(), {
  rows: 5,
  width: '100%',
})
</script>

<template>
  <div class="skeleton-grid" :style="{ width }">
    <div
      v-for="i in rows"
      :key="i"
      class="skeleton-row"
      :style="{ animationDelay: `${(i - 1) * 60}ms` }"
    />
  </div>
</template>

<style scoped>
.skeleton-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.skeleton-row {
  height: 16px;
  border-radius: var(--radius-sm);
  background: var(--bg-surface-2);
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

@keyframes skeleton-pulse {
  0%, 100% { opacity: 0.4; }
  50%      { opacity: 0.7; }
}
</style>
