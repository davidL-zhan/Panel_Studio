<!-- DDD §04-page-state-matrix.md §2 — 嘉宾 skeleton 占位网格 -->
<script setup lang="ts">
defineProps<{ count: number }>()
</script>

<template>
  <div class="skeleton-grid">
    <div v-for="i in count" :key="i" class="skeleton-card"
         :style="{ animationDelay: `${(i - 1) * 80}ms` }" />
  </div>
</template>

<style scoped>
.skeleton-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-lg);
}
.skeleton-card {
  width: 180px;
  height: 120px;
  border-radius: var(--radius-lg);
  background: var(--bg-surface-2);
  animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 0.3; }
  50%      { opacity: 0.6; }
}
</style>
