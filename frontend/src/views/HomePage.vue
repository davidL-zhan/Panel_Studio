<!--
  DDD §06-page-layout.md §1 — 首页（占位）
  DDD §02-information-architecture.md §4.1 — 信息优先级
  后续 DDD-3 实现完整首页
-->
<script setup lang="ts">
import { onMounted } from 'vue'
import { useDiscussionListStore } from '@/stores/discussion-list'

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
    <p class="home-placeholder">讨论列表与创建 — 将在 DDD-3 实现</p>
  </main>
</template>

<style scoped>
.home-page {
  max-width: 720px;
  margin: 0 auto;
  padding: var(--space-3xl) var(--space-lg);
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
.home-placeholder {
  color: var(--text-tertiary);
  text-align: center;
  padding: var(--space-2xl);
  border: 1px dashed var(--border-default);
  border-radius: var(--radius-lg);
}
</style>
