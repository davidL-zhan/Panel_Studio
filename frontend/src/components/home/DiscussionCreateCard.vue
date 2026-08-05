<!-- DDD §06-page-layout.md §1 — 创建讨论卡片 -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Plus } from 'lucide-vue-next'
import { useDiscussionListStore } from '@/stores/discussion-list'
import { useToast } from '@/composables/useToast'
import { DISCUSSION } from '@/constants/design-tokens'
import TopicInput from './TopicInput.vue'
import ExpertCountSelector from './ExpertCountSelector.vue'

const router = useRouter()
const listStore = useDiscussionListStore()
const toast = useToast()

const topic = ref('')
const expertCount = ref(DISCUSSION.defaultExperts)
const creating = ref(false)

const canCreate = computed(() =>
  topic.value.trim().length > 0 && topic.value.length <= DISCUSSION.maxTopicLength && !creating.value
)

async function handleCreate() {
  if (!canCreate.value) return
  creating.value = true
  try {
    const discussion = await listStore.create(topic.value.trim(), expertCount.value)
    router.push({ name: 'discussion', params: { id: discussion.id } })
  } catch {
    toast.addToast('创建讨论失败，请重试', 'error')
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <div class="create-card">
    <div class="create-row">
      <TopicInput v-model="topic" />
      <ExpertCountSelector v-model="expertCount" />
      <button
        class="create-btn"
        :disabled="!canCreate"
        @click="handleCreate"
        :aria-label="creating ? '创建中...' : '创建讨论'"
      >
        <Plus v-if="!creating" :size="18" />
        <span class="spinner" v-else />
        <span class="btn-text">{{ creating ? '创建中...' : '创建讨论' }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.create-card {
  background: var(--bg-surface-1);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  margin-bottom: var(--space-xl);
}
.create-row {
  display: flex;
  gap: var(--space-sm);
  align-items: flex-start;
}
/* 手机端垂直堆叠 */
@media (max-width: 767px) {
  .create-row {
    flex-direction: column;
  }
  .create-btn {
    width: 100%;
    justify-content: center;
  }
}
.create-btn {
  flex-shrink: 0;
  height: 48px;
  padding: 0 var(--space-lg);
  border-radius: var(--radius-md);
  background: var(--color-success);
  color: var(--bg-root);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  transition: all var(--duration-fast) var(--ease-out);
}
.create-btn:hover:not(:disabled) { filter: brightness(1.1); }
.create-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.btn-text { white-space: nowrap; }
.spinner {
  width: 16px; height: 16px;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
