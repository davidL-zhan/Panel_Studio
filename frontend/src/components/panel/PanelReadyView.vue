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

    <!-- 操作按钮 -->
    <PanelActions
      :starting="starting"
      :regenerating="regenerating"
      @start="handleStart"
      @regenerate="handleRegenerate"
    />
  </div>
</template>

<style scoped>
.panel-ready-view {
  max-width: 960px;
  margin: 0 auto;
  padding: var(--space-xl) var(--space-lg);
}
.topic-title {
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  text-align: center;
  margin-bottom: var(--space-xl);
}
.host-section {
  display: flex;
  justify-content: center;
  margin-bottom: var(--space-xl);
}
.experts-section {
  margin-bottom: var(--space-md);
}
</style>
