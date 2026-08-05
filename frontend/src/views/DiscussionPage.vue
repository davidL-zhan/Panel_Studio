<!-- DDD §07-component-architecture §2.1 — 讨论详情容器（状态驱动子视图切换） -->
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDiscussionStore } from '@/stores/discussion'
import { useWebSocketStore } from '@/stores/websocket'
import { useDiscussionListStore } from '@/stores/discussion-list'
import { DiscussionStatus } from '@/types/enums'
import { useToast } from '@/composables/useToast'
import LoadingSkeleton from '@/components/shared/LoadingSkeleton.vue'
import ErrorOverlay from '@/components/shared/ErrorOverlay.vue'
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue'
import DiscussionTopBar from '@/components/layout/DiscussionTopBar.vue'
import PendingPanelView from '@/components/panel/PendingPanelView.vue'
import PanelReadyView from '@/components/panel/PanelReadyView.vue'
import StudioView from '@/components/studio/StudioView.vue'
import EndedView from '@/components/ended/EndedView.vue'

const route = useRoute()
const router = useRouter()
const store = useDiscussionStore()
const listStore = useDiscussionListStore()
const wsStore = useWebSocketStore()
const toast = useToast()

const studioRef = ref<InstanceType<typeof StudioView> | null>(null)
const ending = ref(false)
const showEndConfirm = ref(false)

onMounted(async () => {
  const id = route.params.id as string
  try { await store.fetchDiscussion(id) }
  catch { toast.addToast('加载讨论失败', 'error') }
})

onUnmounted(() => { store.reset(); wsStore.disconnect() })

function handleRefresh() { router.go(0) }

async function handleEnd() {
  showEndConfirm.value = false
  ending.value = true
  try {
    await store.end()
    // StudioView mock WS 结束
    studioRef.value?.endDiscussion()
    toast.addToast('讨论已结束', 'success')
  } catch {
    toast.addToast('结束讨论失败', 'error')
  } finally {
    ending.value = false
  }
}

async function handleDelete() {
  if (!store.discussion) return
  try {
    await listStore.remove(store.discussion.id)
    router.push('/')
  } catch {
    toast.addToast('删除失败', 'error')
  }
}
</script>

<template>
  <div class="discussion-page">
    <!-- Loading -->
    <div v-if="store.loading" class="state-placeholder">
      <LoadingSkeleton :rows="6" width="320px" />
      <p class="state-label">加载中...</p>
    </div>

    <!-- Error -->
    <ErrorOverlay
      v-else-if="store.error"
      :show="true"
      :message="store.error"
      @refresh="handleRefresh"
    />

    <!-- 状态驱动 -->
    <template v-else-if="store.discussion">
      <!-- TopBar (非 PENDING_PANEL 时显示) -->
      <DiscussionTopBar
        v-if="store.discussion.status !== DiscussionStatus.PENDING_PANEL"
        :discussion="store.discussion"
        :ws-status="wsStore.status"
        :ending="ending"
        @end="showEndConfirm = true"
      />

      <!-- PENDING_PANEL -->
      <PendingPanelView
        v-if="store.discussion.status === DiscussionStatus.PENDING_PANEL"
      />

      <!-- PANEL_READY -->
      <PanelReadyView
        v-else-if="store.discussion.status === DiscussionStatus.PANEL_READY"
      />

      <!-- IN_PROGRESS (演播厅) -->
      <StudioView
        v-else-if="store.discussion.status === DiscussionStatus.IN_PROGRESS"
        ref="studioRef"
        @end="showEndConfirm = true"
      />

      <!-- ENDED -->
      <EndedView
        v-else-if="store.discussion.status === DiscussionStatus.ENDED"
        @delete="handleDelete"
      />
    </template>

    <!-- 结束讨论确认 -->
    <ConfirmDialog
      :open="showEndConfirm"
      title="结束讨论"
      message="确定结束当前讨论？主持人将进行总结。"
      confirm-label="结束讨论"
      variant="danger"
      @confirm="handleEnd"
      @cancel="showEndConfirm = false"
    />
  </div>
</template>

<style scoped>
.discussion-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.state-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-3xl);
  max-width: 400px;
  margin: auto;
}
.state-label {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
}
</style>
