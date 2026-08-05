<!-- DDD §06-page-layout §4 — 演播厅专家阵列 · DDD §10-accessibility §2 键盘导航 -->
<script setup lang="ts">
import { ref } from 'vue'
import type { Panelist } from '@/types/domain'
import ExpertSpot from './ExpertSpot.vue'

defineProps<{ experts: Panelist[] }>()

const gridRef = ref<HTMLElement | null>(null)

const columnsPerRow = (count: number) => {
  if (count <= 4) return count
  if (count <= 6) return Math.ceil(count / 2)
  return 4
}

function handleKeydown(e: KeyboardEvent, count: number) {
  const cols = columnsPerRow(count)
  const items = gridRef.value?.querySelectorAll<HTMLElement>('[role="gridcell"]')
  if (!items || items.length === 0) return
  const idx = Array.from(items).indexOf(document.activeElement as HTMLElement)
  if (idx === -1) return

  let next = idx
  if (e.key === 'ArrowRight') next = Math.min(idx + 1, items.length - 1)
  else if (e.key === 'ArrowLeft') next = Math.max(idx - 1, 0)
  else if (e.key === 'ArrowDown') next = Math.min(idx + cols, items.length - 1)
  else if (e.key === 'ArrowUp') next = Math.max(idx - cols, 0)
  else return

  e.preventDefault()
  items[next]?.focus()
}
</script>

<template>
  <div
    ref="gridRef"
    role="grid"
    aria-label="专家嘉宾"
    class="studio-grid"
    :class="`count-${experts.length}`"
    @keydown="handleKeydown($event, experts.length)"
  >
    <ExpertSpot v-for="expert in experts" :key="expert.id" :panelist="expert" />
  </div>
</template>

<style scoped>
.studio-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-md);
}
.count-5 { max-width: 720px; margin: 0 auto; }
</style>
