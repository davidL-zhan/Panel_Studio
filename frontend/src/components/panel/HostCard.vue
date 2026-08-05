<!-- DDD §07-component-architecture.md §2.3 — 主持人卡片 -->
<script setup lang="ts">
import type { Panelist } from '@/types/domain'

defineProps<{ host: Panelist }>()
</script>

<template>
  <div class="host-card" :style="{ '--panelist-color': host.color }">
    <div class="color-block" />
    <div class="host-info">
      <span class="host-badge">🎤 主持人</span>
      <p class="host-name">{{ host.name }}</p>
      <p class="host-detail">{{ host.profession }} · {{ host.title }}</p>
      <p class="host-stance">{{ host.stance }}</p>
    </div>
  </div>
</template>

<style scoped>
.host-card {
  display: inline-flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-xl);
  background: var(--bg-surface-1);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  max-width: 500px;
}
.color-block {
  width: 8px;
  height: 56px;
  border-radius: var(--radius-sm);
  background: var(--panelist-color);
  flex-shrink: 0;
}
.host-badge {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  font-weight: var(--font-medium);
}
.host-name {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  margin-top: 2px;
}
.host-detail {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  margin-top: 2px;
}
.host-stance {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  margin-top: 4px;
}
</style>
