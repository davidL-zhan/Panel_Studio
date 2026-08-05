<!--
  DDD §07-component-architecture.md §2.1 — 讨论详情容器（状态驱动子视图切换）
  后续 DDD-3/DDD-4 实现 PendingPanelView / PanelReadyView / StudioView / EndedView
-->
<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useDiscussionStore } from '@/stores/discussion'
import { DiscussionStatus } from '@/types/enums'

const route = useRoute()
const store = useDiscussionStore()

onMounted(async () => {
  const id = route.params.id as string
  await store.fetchDiscussion(id)
})

// 路由参数变化时重新加载
watch(() => route.params.id, (id) => {
  if (id) store.fetchDiscussion(id as string)
})
</script>

<template>
  <div class="discussion-page">
    <!-- Loading -->
    <div v-if="store.loading" class="state-placeholder">
      <p>加载中...</p>
    </div>

    <!-- Error -->
    <div v-else-if="store.error" class="state-placeholder error">
      <p>{{ store.error }}</p>
    </div>

    <!-- 状态驱动视图 -->
    <template v-else-if="store.discussion">
      <div class="state-placeholder" v-if="store.discussion.status === DiscussionStatus.PENDING_PANEL">
        <p>PENDING_PANEL — 等待嘉宾生成（将在 DDD-3 实现）</p>
      </div>
      <div class="state-placeholder" v-else-if="store.discussion.status === DiscussionStatus.PANEL_READY">
        <p>PANEL_READY — 嘉宾阵容确认（将在 DDD-3 实现）</p>
      </div>
      <div class="state-placeholder" v-else-if="store.discussion.status === DiscussionStatus.IN_PROGRESS">
        <p>IN_PROGRESS — 演播厅（将在 DDD-4 实现）</p>
      </div>
      <div class="state-placeholder" v-else-if="store.discussion.status === DiscussionStatus.ENDED">
        <p>ENDED — 讨论结果（将在 DDD-4 实现）</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.discussion-page {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.state-placeholder {
  padding: var(--space-2xl);
  border: 1px dashed var(--border-default);
  border-radius: var(--radius-lg);
  color: var(--text-tertiary);
}
.state-placeholder.error {
  border-color: var(--color-error);
  color: var(--color-error);
}
</style>
