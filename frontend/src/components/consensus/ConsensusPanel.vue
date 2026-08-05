<!-- DDD §07-component-architecture §2.7 — 共识/分歧面板 · 独立滚动 -->
<script setup lang="ts">
import type { ConsensusPoint } from '@/types/domain'
import ConsensusPointItem from './ConsensusPointItem.vue'

defineProps<{ points: ConsensusPoint[] }>()
</script>

<template>
  <div class="consensus-panel" role="feed" aria-label="共识与分歧">
    <h3 class="panel-title">共识与分歧</h3>
    <div v-if="points.length === 0" class="empty">尚无共识与分歧</div>
    <div v-else class="cp-list">
      <ConsensusPointItem
        v-for="point in points"
        :key="point.id"
        :point="point"
      />
    </div>
  </div>
</template>

<style scoped>
.consensus-panel {
  height: 100%;
  overflow-y: auto;
  padding: var(--space-md);
  background: var(--bg-surface-1);
  border-radius: var(--radius-lg);
}
.panel-title {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--space-sm);
  position: sticky; top: 0;
  background: var(--bg-surface-1);
  padding-bottom: var(--space-xs);
  z-index: 1;
}
.empty {
  color: var(--text-tertiary);
  font-size: var(--text-sm);
  text-align: center;
  padding: var(--space-xl);
}
.cp-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}
</style>
