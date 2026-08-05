<!-- DDD §06-page-layout.md §1 — 首页 · DDD §02-information-architecture §4.1 -->
<script setup lang="ts">
import { onMounted } from 'vue'
import { useDiscussionListStore } from '@/stores/discussion-list'
import DiscussionCreateCard from '@/components/home/DiscussionCreateCard.vue'
import DiscussionList from '@/components/home/DiscussionList.vue'
import LoadingSkeleton from '@/components/shared/LoadingSkeleton.vue'

const listStore = useDiscussionListStore()

onMounted(() => {
  listStore.fetchList()
})
</script>

<template>
  <main class="home-page">
    <header class="home-header">
      <h1 class="home-title">AI Panel Studio</h1>
      <p class="home-subtitle">虚拟智库 · AI 圆桌讨论</p>
    </header>

    <DiscussionCreateCard />

    <div v-if="listStore.loading" class="loading-wrap">
      <LoadingSkeleton :rows="4" width="100%" />
    </div>
    <DiscussionList v-else />
  </main>
</template>

<style scoped>
.home-page {
  max-width: 720px;
  margin: 0 auto;
  padding: var(--space-3xl) var(--space-lg);
  overflow-y: auto;
  height: 100vh;
}
@media (max-width: 767px) {
  .home-page { padding: var(--space-xl) var(--space-md); }
}
.home-header {
  text-align: center;
  margin-bottom: var(--space-2xl);
}
.home-title {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
}
.home-subtitle {
  margin-top: var(--space-sm);
  color: var(--text-secondary);
}
.loading-wrap {
  margin-top: var(--space-lg);
}
</style>
