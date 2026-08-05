<!--
  DDD §08-interaction-specification.md §4 — ErrorOverlay
  全屏遮罩 · 不可恢复错误 · 刷新按钮
-->
<script setup lang="ts">
import { AlertTriangle, RefreshCw } from 'lucide-vue-next'

defineProps<{
  message: string
  show: boolean
}>()

const emit = defineEmits<{
  refresh: []
}>()
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="error-overlay" role="alert">
      <div class="error-card">
        <AlertTriangle :size="48" class="error-icon" />
        <h2 class="error-title">连接已断开</h2>
        <p class="error-message">{{ message }}</p>
        <button class="error-btn" @click="emit('refresh')">
          <RefreshCw :size="16" />
          <span>刷新页面</span>
        </button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.error-overlay {
  position: fixed;
  inset: 0;
  z-index: 10001;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-root);
}

.error-card {
  text-align: center;
  max-width: 400px;
  padding: var(--space-2xl);
}

.error-icon {
  color: var(--color-error);
  margin-bottom: var(--space-lg);
}

.error-title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  margin-bottom: var(--space-sm);
}

.error-message {
  color: var(--text-secondary);
  font-size: var(--text-sm);
  margin-bottom: var(--space-xl);
}

.error-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  height: 44px;
  padding: 0 var(--space-xl);
  border-radius: var(--radius-md);
  background: var(--bg-surface-2);
  border: 1px solid var(--border-default);
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  transition: background var(--duration-fast);
}
.error-btn:hover { background: var(--bg-surface-3); }
</style>
