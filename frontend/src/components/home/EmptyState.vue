<!-- DDD §02-information-architecture.md §4.1 — 空状态引导 -->
<script setup lang="ts">
import { MessageSquare } from 'lucide-vue-next'

withDefaults(defineProps<{
  message?: string
  iconSize?: 'small' | 'large'
}>(), {
  message: '暂无内容',
  iconSize: 'small',
})
</script>

<template>
  <div class="empty-state">
    <MessageSquare :size="iconSize === 'large' ? 48 : 32" class="empty-icon" />
    <p>{{ message }}</p>
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-3xl) var(--space-lg);
  color: var(--text-tertiary);
  text-align: center;
}
.empty-icon { opacity: 0.4; }
</style>
