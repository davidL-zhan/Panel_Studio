<!-- DDD §06-page-layout §5 — 主持人总结卡片 -->
<script setup lang="ts">
defineProps<{ summary: string }>()
</script>

<template>
  <div class="summary-card">
    <h2 class="summary-title">主持人总结</h2>
    <p class="summary-text">{{ summary }}</p>
  </div>
</template>

<style scoped>
.summary-card {
  max-width: 720px;
  margin: 0 auto;
  padding: var(--space-xl);
  background: var(--bg-surface-1);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
}
.summary-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  margin-bottom: var(--space-md);
}
.summary-text {
  font-size: var(--text-base);
  line-height: 1.8;
  color: var(--text-secondary);
}
</style>
