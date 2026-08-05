<!-- DDD §06-page-layout.md §1 — 专家人数选择器 (4–8) -->
<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next'
import { DISCUSSION } from '@/constants/design-tokens'

const model = defineModel<number>({ default: DISCUSSION.defaultExperts })
</script>

<template>
  <div class="selector-wrap">
    <label for="expert-count" class="sr-only">专家人数</label>
    <select id="expert-count" class="selector" v-model.number="model">
      <option v-for="n in 5" :key="n + 3" :value="n + 3">
        {{ n + 3 }} 位专家
      </option>
    </select>
    <ChevronDown :size="14" class="selector-icon" />
  </div>
</template>

<style scoped>
.selector-wrap {
  position: relative;
  flex-shrink: 0;
}
.selector {
  appearance: none;
  height: 48px;
  padding: 0 32px 0 var(--space-md);
  background: var(--bg-surface-1);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-sm);
  cursor: pointer;
  min-width: 110px;
}
.selector:focus {
  border-color: var(--border-focus);
  outline: none;
}
.selector-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary);
  pointer-events: none;
}
.sr-only {
  position: absolute; width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
}
</style>
