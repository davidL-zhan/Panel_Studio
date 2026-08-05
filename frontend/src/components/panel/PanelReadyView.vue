<!-- DDD §04-page-state-matrix.md §3 — PANEL_READY 视图 -->
<script setup lang="ts">
import { ref } from 'vue'
import { useDiscussionStore } from '@/stores/discussion'
import { useToast } from '@/composables/useToast'
import HostCard from './HostCard.vue'
import PanelistGrid from './PanelistGrid.vue'
import PanelActions from './PanelActions.vue'

const store = useDiscussionStore()
const toast = useToast()

const replacingId = ref<string | null>(null)
const starting = ref(false)
const regenerating = ref(false)

async function handleStart() {
  starting.value = true
  try {
    await store.start()
    // 视图将自动切换为 StudioView（由 DiscussionPage 容器根据 status 切换）
  } catch {
    toast.addToast('开始讨论失败', 'error')
  } finally {
    starting.value = false
  }
}

async function handleRegenerate() {
  regenerating.value = true
  try {
    await store.regenerateAll()
    toast.addToast('嘉宾阵容已重新生成', 'success')
  } catch {
    toast.addToast('重新生成失败', 'error')
  } finally {
    regenerating.value = false
  }
}

async function handleReplace(panelistId: string) {
  replacingId.value = panelistId
  try {
    await store.replaceExpert(panelistId)
    toast.addToast('专家已替换', 'success')
  } catch {
    toast.addToast('替换失败', 'error')
  } finally {
    replacingId.value = null
  }
}
</script>

<template>
  <div class="panel-ready-view">
    <h2 class="topic-title">{{ store.discussion?.topic }}</h2>

    <!-- 主持人 -->
    <div class="host-section" v-if="store.host">
      <HostCard :host="store.host" />
    </div>

    <!-- 专家网格 -->
    <div class="experts-section" v-if="store.experts.length">
      <PanelistGrid
        :experts="store.experts"
        :show-replace="true"
        :replacing-id="replacingId"
        @replace="handleReplace"
      />
    </div>

    <!-- 操作按钮（吸底） -->
    <div class="actions-sticky">
      <PanelActions
        :starting="starting"
        :regenerating="regenerating"
        @start="handleStart"
        @regenerate="handleRegenerate"
      />
    </div>
  </div>
</template>

<style scoped>
.panel-ready-view {
  max-width: 960px;
  margin: 0 auto;
  padding: var(--space-lg) var(--space-lg) 0;
  overflow-y: auto;
  height: 100%;
}
.topic-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  text-align: center;
  margin-bottom: var(--space-md);
}
.host-section {
  display: flex;
  justify-content: center;
  margin-bottom: var(--space-md);
}
.experts-section {
  margin-bottom: var(--space-md);
}
/* 操作按钮吸底 */
.actions-sticky {
  position: sticky;
  bottom: 0;
  background: var(--bg-root);
  padding: var(--space-md) 0;
  border-top: 1px solid var(--border-subtle);
  margin-top: var(--space-md);
}
</style>
