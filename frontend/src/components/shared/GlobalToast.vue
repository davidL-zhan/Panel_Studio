<!--
  DDD §05-design-system.md §9 — Toast 规范
  DDD §08-interaction-specification.md §7 — 堆叠策略
  堆叠 ≤3 条 · 4 种 variant · 3s 自动消失 · 右上角滑入
-->
<script setup lang="ts">
import { ref } from 'vue'
import { X } from 'lucide-vue-next'
import { TOAST } from '@/constants/design-tokens'

export interface ToastMessage {
  id: number
  message: string
  variant: 'success' | 'warning' | 'error' | 'info'
}

const toasts = ref<ToastMessage[]>([])
let nextId = 0

function addToast(message: string, variant: ToastMessage['variant'] = 'info') {
  // 同类型消息替换上一条
  const existing = toasts.value.find((t) => t.variant === variant && t.message === message)
  if (existing) {
    existing.id = nextId++
    return
  }

  const toast: ToastMessage = { id: nextId++, message, variant }
  toasts.value.push(toast)

  // 超过 3 条移除最旧
  if (toasts.value.length > TOAST.maxStack) {
    toasts.value.shift()
  }

  // 自动消失
  setTimeout(() => {
    removeToast(toast.id)
  }, TOAST.duration)
}

function removeToast(id: number) {
  toasts.value = toasts.value.filter((t) => t.id !== id)
}

// 暴露给全局使用
defineExpose({ addToast, removeToast })
</script>

<template>
  <Teleport to="body">
    <div class="toast-container" aria-live="polite" role="status">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast-item"
          :class="`toast-${toast.variant}`"
          :role="toast.variant === 'error' ? 'alert' : 'status'"
        >
          <span class="toast-message">{{ toast.message }}</span>
          <button class="toast-close" @click="removeToast(toast.id)" :aria-label="'关闭通知'">
            <X :size="14" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-container {
  position: fixed;
  top: var(--space-lg);
  right: var(--space-lg);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  max-width: 380px;
  pointer-events: none;
}

.toast-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--text-primary);
  background: var(--bg-surface-2);
  border: 1px solid var(--border-default);
  box-shadow: var(--shadow-md);
  pointer-events: auto;
  min-width: 280px;
}

.toast-success { border-left: 3px solid var(--color-success); }
.toast-warning { border-left: 3px solid var(--color-warning); }
.toast-error   { border-left: 3px solid var(--color-error); }
.toast-info    { border-left: 3px solid var(--color-info); }

.toast-message { flex: 1; }

.toast-close {
  flex-shrink: 0;
  padding: 2px;
  border-radius: var(--radius-sm);
  color: var(--text-tertiary);
  transition: color var(--duration-fast) var(--ease-out);
}
.toast-close:hover { color: var(--text-primary); }

/* TransitionGroup 动画 */
.toast-enter-active {
  transition: all var(--duration-slow) var(--ease-out);
}
.toast-leave-active {
  transition: all var(--duration-fast) var(--ease-in);
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
