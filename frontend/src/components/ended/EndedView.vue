<!-- DDD §06-page-layout §5 — ENDED 视图 -->
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDiscussionStore } from '@/stores/discussion'
import HostSummaryCard from './HostSummaryCard.vue'
import ConsensusPanel from '@/components/consensus/ConsensusPanel.vue'
import TranscriptPanel from '@/components/transcript/TranscriptPanel.vue'
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue'

const emit = defineEmits<{ delete: [] }>()
const store = useDiscussionStore()
const router = useRouter()
const showDeleteConfirm = ref(false)

const summary = ref('本次讨论围绕核心议题展开了深入探讨。专家们从多个维度进行了观点碰撞，既达成了部分共识，也存在根本性的分歧。感谢各位的参与，期待下一次圆桌讨论。')
</script>

<template>
  <div class="ended-view">
    <HostSummaryCard :summary="summary" />

    <div class="dual-panel">
      <ConsensusPanel :points="store.consensusPoints" />
      <TranscriptPanel :messages="store.messages" />
    </div>

    <div class="ended-actions">
      <button class="btn btn-secondary" @click="router.push('/')">返回首页</button>
      <button class="btn btn-danger" @click="showDeleteConfirm = true">删除讨论</button>
    </div>

    <ConfirmDialog
      :open="showDeleteConfirm"
      title="删除讨论"
      message="确定删除此讨论？所有数据不可恢复。"
      confirm-label="删除"
      variant="danger"
      @confirm="emit('delete'); showDeleteConfirm = false"
      @cancel="showDeleteConfirm = false"
    />
  </div>
</template>

<style scoped>
.ended-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: var(--space-lg);
  gap: var(--space-lg);
  overflow: hidden;
}
.dual-panel {
  display: grid;
  grid-template-columns: 35fr 65fr;
  gap: var(--space-md);
  flex: 1;
  min-height: 0;
}
.ended-actions {
  display: flex;
  justify-content: center;
  gap: var(--space-md);
  flex-shrink: 0;
  padding-top: var(--space-md);
}
/* 平板/手机：双栏改为垂直堆叠 */
@media (max-width: 1023px) {
  .dual-panel {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }
  .ended-view { padding: var(--space-md); }
}
.btn {
  height: 40px; padding: 0 var(--space-xl);
  border-radius: var(--radius-md);
  font-size: var(--text-sm); font-weight: var(--font-medium);
  transition: all var(--duration-fast);
}
.btn-secondary {
  background: transparent; color: var(--text-primary);
  border: 1px solid var(--border-default);
}
.btn-secondary:hover { background: var(--bg-surface-3); }
.btn-danger {
  background: var(--color-error); color: #fff;
}
.btn-danger:hover { filter: brightness(1.1); }
</style>
