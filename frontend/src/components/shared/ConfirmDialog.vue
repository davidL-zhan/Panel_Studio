<!--
  DDD §05-design-system.md §9 — Dialog 规范
  DDD §10-accessibility.md §8 — 焦点管理
  role="dialog" · aria-modal · Tab 循环 · Escape 关闭 · danger/default variants
-->
<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

const props = withDefaults(defineProps<{
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'danger'
}>(), {
  confirmLabel: '确认',
  cancelLabel: '取消',
  variant: 'default',
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const dialogRef = ref<HTMLElement | null>(null)
const cancelBtnRef = ref<HTMLButtonElement | null>(null)

// 打开时焦点移至取消按钮
watch(() => props.open, async (val) => {
  if (val) {
    await nextTick()
    cancelBtnRef.value?.focus()
  }
})

// Tab 循环锁定
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    emit('cancel')
  }
  if (e.key === 'Tab' && dialogRef.value) {
    const focusable = dialogRef.value.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last?.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first?.focus()
    }
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="dialog-overlay"
      @click.self="emit('cancel')"
      @keydown="handleKeydown"
    >
      <div
        ref="dialogRef"
        class="dialog"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="'dialog-title'"
      >
        <h2 id="dialog-title" class="dialog-title">{{ title }}</h2>
        <p class="dialog-message">{{ message }}</p>
        <div class="dialog-actions">
          <button
            ref="cancelBtnRef"
            class="btn btn-secondary"
            @click="emit('cancel')"
          >
            {{ cancelLabel }}
          </button>
          <button
            class="btn"
            :class="variant === 'danger' ? 'btn-danger' : 'btn-primary'"
            @click="emit('confirm')"
          >
            {{ confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
}

.dialog {
  background: var(--bg-surface-2);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-xl);
  padding: var(--space-xl);
  box-shadow: var(--shadow-lg);
  max-width: 440px;
  width: 90vw;
}

.dialog-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  margin-bottom: var(--space-sm);
}

.dialog-message {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: var(--leading-sm);
  margin-bottom: var(--space-lg);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
}

.btn {
  height: 40px;
  padding: 0 var(--space-lg);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  transition: all var(--duration-fast) var(--ease-out);
}

.btn-primary {
  background: var(--color-success);
  color: var(--bg-root);
}
.btn-primary:hover { filter: brightness(1.1); }

.btn-secondary {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border-default);
}
.btn-secondary:hover { background: var(--bg-surface-3); }

.btn-danger {
  background: var(--color-error);
  color: #fff;
}
.btn-danger:hover { filter: brightness(1.1); }
</style>
