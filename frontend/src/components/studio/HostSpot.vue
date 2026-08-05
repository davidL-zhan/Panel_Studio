<!-- DDD §06-page-layout §4 — 演播厅主持人位置 -->
<script setup lang="ts">
import type { Panelist } from '@/types/domain'
import { PanelistStatus } from '@/types/enums'

defineProps<{ host: Panelist }>()
</script>

<template>
  <div
    class="host-spot"
    :class="{ speaking: host.status === PanelistStatus.SPEAKING }"
    :style="{ '--panelist-color': host.color }"
  >
    <div class="host-badge">🎤 主持人</div>
    <span class="host-name">{{ host.name }}</span>
    <span class="host-title">{{ host.title }}</span>
  </div>
</template>

<style scoped>
.host-spot {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
  background: var(--bg-surface-1);
  transition: all var(--duration-base) var(--ease-out);
}
.host-spot.speaking {
  border-color: var(--panelist-color);
  border-width: 2px;
  background: color-mix(in srgb, var(--panelist-color) 8%, var(--bg-surface-1));
}
.host-badge { font-size: var(--text-xs); color: var(--text-secondary); flex-shrink: 0; }
.host-name { font-size: var(--text-sm); font-weight: var(--font-semibold); }
.host-title { font-size: var(--text-xs); color: var(--text-tertiary); }
</style>
