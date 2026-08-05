// DDD §07-component-architecture.md §3.1 — 首页讨论列表 Store
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Discussion } from '@/types/domain'
import * as api from '@/api/endpoints'

export const useDiscussionListStore = defineStore('discussionList', () => {
  const discussions = ref<Discussion[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchList() {
    loading.value = true
    error.value = null
    try {
      const res = await api.fetchDiscussions()
      discussions.value = res.data
    } catch (e) {
      error.value = e instanceof Error ? e.message : '加载讨论列表失败'
    } finally {
      loading.value = false
    }
  }

  async function create(topic: string, expertCount = 4) {
    loading.value = true
    error.value = null
    try {
      const res = await api.createDiscussion({ topic, expert_count: expertCount })
      return res.data
    } catch (e) {
      error.value = e instanceof Error ? e.message : '创建讨论失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function remove(id: string) {
    try {
      await api.deleteDiscussion(id)
      discussions.value = discussions.value.filter((d) => d.id !== id)
    } catch (e) {
      error.value = e instanceof Error ? e.message : '删除讨论失败'
      throw e
    }
  }

  return { discussions, loading, error, fetchList, create, remove }
})
