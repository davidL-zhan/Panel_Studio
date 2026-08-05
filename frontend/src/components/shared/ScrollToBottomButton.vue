<!--
  DDD §08-interaction-specification.md §2 — ScrollToBottomButton
  Transcript 手动上滚时浮现，点击滚动到底部恢复自动追随
-->
<script setup lang="ts">
import { ArrowDown } from 'lucide-vue-next'

defineEmits<{
  click: []
}>()
</script>

<template>
  <button
    class="scroll-btn"
    @click="$emit('click')"
    aria-label="滚动到最新消息"
  >
    <ArrowDown :size="18" />
  </button>
</template>

<style scoped>
.scroll-btn {
  position: absolute;
  bottom: var(--space-lg);
  right: var(--space-lg);
  z-index: 10;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: var(--bg-surface-2);
  border: 1px solid var(--border-default);
  color: var(--text-primary);
  box-shadow: var(--shadow-md);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--duration-fast) var(--ease-out);
  animation: scroll-btn-in var(--duration-slow) var(--ease-out);
}
.scroll-btn:hover {
  background: var(--bg-surface-3);
  transform: translateY(-2px);
}

@keyframes scroll-btn-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
