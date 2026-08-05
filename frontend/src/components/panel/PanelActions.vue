<!-- DDD §06-page-layout.md §3 — 操作按钮区 -->
<script setup lang="ts">
import { ref } from 'vue'
import { Play, RotateCcw } from 'lucide-vue-next'
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue'

defineProps<{ starting?: boolean; regenerating?: boolean }>()
const emit = defineEmits<{ start: []; regenerate: [] }>()

const showRegenConfirm = ref(false)
</script>

<template>
  <div class="actions">
    <button
      class="btn btn-secondary"
      :disabled="regenerating"
      @click="showRegenConfirm = true"
    >
      <RotateCcw :size="16" :class="{ spinning: regenerating }" />
      {{ regenerating ? '生成中...' : '全部重新生成' }}
    </button>

    <button
      class="btn btn-primary"
      :disabled="starting"
      @click="emit('start')"
    >
      <Play :size="16" />
      {{ starting ? '启动中...' : '开始讨论' }}
    </button>
  </div>

  <ConfirmDialog
    :open="showRegenConfirm"
    title="全部重新生成"
    message="确定重新生成全部嘉宾？当前阵容将丢失。"
    confirm-label="重新生成"
    variant="danger"
    @confirm="emit('regenerate'); showRegenConfirm = false"
    @cancel="showRegenConfirm = false"
  />
</template>

<style scoped>
.actions {
  display: flex;
  justify-content: center;
  gap: var(--space-md);
  padding-top: var(--space-xl);
}
.btn {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  height: 44px;
  padding: 0 var(--space-xl);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  transition: all var(--duration-fast) var(--ease-out);
}
.btn-primary {
  background: var(--color-success);
  color: var(--bg-root);
}
.btn-primary:hover:not(:disabled) { filter: brightness(1.1); }
.btn-secondary {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border-default);
}
.btn-secondary:hover:not(:disabled) { background: var(--bg-surface-3); }
.btn:disabled { opacity: 0.4; cursor: not-allowed; }
.spinning { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
