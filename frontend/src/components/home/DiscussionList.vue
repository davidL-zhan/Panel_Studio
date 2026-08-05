<!-- DDD §02-information-architecture.md §4.1 — 讨论列表 -->
<script setup lang="ts">
import { useDiscussionListStore } from '@/stores/discussion-list'
import DiscussionCard from './DiscussionCard.vue'
import EmptyState from './EmptyState.vue'

const listStore = useDiscussionListStore()
</script>

<template>
  <section>
    <h2 v-if="listStore.discussions.length" class="list-heading">讨论列表</h2>
    <div v-if="listStore.discussions.length" class="list-grid">
      <DiscussionCard
        v-for="d in listStore.discussions"
        :key="d.id"
        :discussion="d"
      />
    </div>
    <EmptyState v-else icon-size="large" message="暂无讨论，请创建一个" />
  </section>
</template>

<style scoped>
.list-heading {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-secondary);
  margin-bottom: var(--space-md);
}
.list-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}
</style>
