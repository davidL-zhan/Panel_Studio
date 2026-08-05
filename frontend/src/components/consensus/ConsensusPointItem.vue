<!-- DDD §07-component-architecture §2.7 — 单条共识/分歧 -->
<script setup lang="ts">
import { computed } from 'vue'
import { CheckCircle2, AlertCircle } from 'lucide-vue-next'
import { ConsensusType } from '@/types/enums'
import type { ConsensusPoint } from '@/types/domain'

const props = defineProps<{ point: ConsensusPoint; isNew?: boolean }>()

const isConsensus = computed(() => props.point.point_type === ConsensusType.CONSENSUS)
</script>

<template>
  <div class="cp-item" :class="{ consensus: isConsensus, disagreement: !isConsensus, new: isNew }">
    <CheckCircle2 v-if="isConsensus" :size="14" class="cp-icon consensus" />
    <AlertCircle v-else :size="14" class="cp-icon disagreement" />
    <p class="cp-content">{{ point.content }}</p>
  </div>
</template>

<style scoped>
.cp-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  padding: var(--space-sm);
  border-radius: var(--radius-md);
  transition: background 1s var(--ease-out);
}
.cp-item.new {
  background: color-mix(in srgb, var(--color-info) 15%, transparent);
}
.cp-icon { flex-shrink: 0; margin-top: 1px; }
.cp-icon.consensus    { color: var(--color-consensus); }
.cp-icon.disagreement { color: var(--color-disagreement); }
.cp-content {
  font-size: var(--text-sm);
  line-height: var(--leading-sm);
  color: var(--text-secondary);
}
</style>
