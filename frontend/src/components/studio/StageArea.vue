<!-- DDD §06-page-layout §4 — 演播厅舞台区（嘉宾阵列固定高度） -->
<script setup lang="ts">
import type { Panelist } from '@/types/domain'
import HostSpot from './HostSpot.vue'
import ExpertGrid from './ExpertGrid.vue'

defineProps<{ host: Panelist | undefined; experts: Panelist[] }>()
</script>

<template>
  <div class="stage-area">
    <div class="host-row" v-if="host">
      <HostSpot :host="host" />
    </div>
    <div class="experts-row" v-if="experts.length">
      <ExpertGrid :experts="experts" />
    </div>
  </div>
</template>

<style scoped>
.stage-area {
  flex-shrink: 0;
  padding: var(--space-md) var(--space-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
}
.host-row { display: flex; justify-content: center; }
.experts-row { width: 100%; max-width: 960px; }
</style>
