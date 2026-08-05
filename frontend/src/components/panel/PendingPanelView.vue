<!-- DDD §04-page-state-matrix.md §2 — PENDING_PANEL 视图 -->
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RefreshCw } from 'lucide-vue-next'
import { useDiscussionStore } from '@/stores/discussion'
import { useToast } from '@/composables/useToast'
import PanelistSkeletonGrid from './PanelistSkeletonGrid.vue'

const store = useDiscussionStore()
const toast = useToast()
const generating = ref(true)
const generateError = ref(false)

onMounted(async () => {
  await doGenerate()
})

async function doGenerate() {
  generating.value = true
  generateError.value = false
  try {
    await store.generatePanel()
  } catch {
    generateError.value = true
    toast.addToast('嘉宾生成失败，请重试', 'error')
  } finally {
    generating.value = false
  }
}
</script>

<template>
  <div class="pending-view">
    <h2 class="topic-title">{{ store.discussion?.topic }}</h2>

    <template v-if="generating">
      <PanelistSkeletonGrid :count="store.discussion?.expert_count ?? 4" />
      <p class="status-text">正在生成嘉宾阵容...</p>
    </template>

    <template v-else-if="generateError">
      <p class="status-text error">生成失败</p>
      <button class="retry-btn" @click="doGenerate">
        <RefreshCw :size="16" />
        重新生成
      </button>
    </template>
  </div>
</template>

<style scoped>
.pending-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2xl);
  padding: var(--space-3xl) var(--space-lg);
}
.topic-title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  text-align: center;
}
.status-text {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}
.status-text.error { color: var(--color-error); }
.retry-btn {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  height: 40px;
  padding: 0 var(--space-lg);
  border-radius: var(--radius-md);
  background: var(--bg-surface-2);
  border: 1px solid var(--border-default);
  color: var(--text-primary);
  font-size: var(--text-sm);
  transition: background var(--duration-fast);
}
.retry-btn:hover { background: var(--bg-surface-3); }
</style>
