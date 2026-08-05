<!--
  DDD §04-page-state-matrix.md §5 — 专家卡片
  DDD §05-design-system.md §8 — 卡片规范
  Q3/Q4 最终决策：静态视觉聚焦，无脉冲/呼吸动画
  STANDBY → opacity 0.7
  PREPARING → opacity 0.85 + 边框微亮(嘉宾色 1px)
  SPEAKING  → opacity 1.0 + 边框高亮 2px + 背景微提亮
-->
<script setup lang="ts">
import { computed } from 'vue'
import { RefreshCw } from 'lucide-vue-next'
import { PanelistStatus } from '@/types/enums'
import type { Panelist } from '@/types/domain'

const props = defineProps<{
  panelist: Panelist
  replacing?: boolean
  showReplace?: boolean
}>()

const emit = defineEmits<{ replace: [] }>()

const statusClass = computed(() => `status-${props.panelist.status.toLowerCase()}`)
const isSpeaking = computed(() => props.panelist.status === PanelistStatus.SPEAKING)
const isPreparing = computed(() => props.panelist.status === PanelistStatus.PREPARING)
</script>

<template>
  <div
    class="expert-card"
    :class="statusClass"
    :data-status="panelist.status"
    :style="{ '--panelist-color': panelist.color }"
    role="gridcell"
    :aria-label="`${panelist.name}，${panelist.profession}，${isSpeaking ? '发言中' : isPreparing ? '准备中' : '待机'}`"
  >
    <!-- 替换遮罩 -->
    <div v-if="replacing" class="replace-overlay">
      <RefreshCw :size="20" class="spinning" />
    </div>

    <!-- 色块 -->
    <div class="color-block" />

    <!-- 信息 -->
    <div class="card-body">
      <p class="card-name">{{ panelist.name }}</p>
      <p class="card-profession">{{ panelist.profession }}</p>
      <p class="card-stance">{{ panelist.stance }}</p>
    </div>

    <!-- 思考摘要 (PREPARING / SPEAKING 时显示) -->
    <p v-if="panelist.current_focus && (isPreparing || isSpeaking)" class="card-focus">
      {{ panelist.current_focus }}
    </p>

    <!-- 替换按钮 -->
    <button
      v-if="showReplace"
      class="replace-btn"
      @click.stop="emit('replace')"
      :disabled="replacing"
    >
      <RefreshCw :size="12" :class="{ spinning: replacing }" />
      替换
    </button>
  </div>
</template>

<style scoped>
.expert-card {
  position: relative;
  width: 200px;
  min-width: 160px;
  padding: var(--space-md);
  background: var(--bg-surface-1);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  transition: opacity var(--duration-base) var(--ease-out),
              border-color var(--duration-base) var(--ease-out),
              background var(--duration-base) var(--ease-out);
}

/* ── 状态样式 (Q3/Q4 决策：静态，无脉冲/呼吸) ── */
.expert-card[data-status="STANDBY"] { opacity: 0.7; }

.expert-card[data-status="PREPARING"] {
  opacity: 0.85;
  border-color: var(--panelist-color);
  border-width: 1px;
}

.expert-card[data-status="SPEAKING"] {
  opacity: 1.0;
  border-color: var(--panelist-color);
  border-width: 2px;
  background: color-mix(in srgb, var(--panelist-color) 8%, var(--bg-surface-1));
}

.color-block {
  width: 32px;
  height: 6px;
  border-radius: var(--radius-sm);
  background: var(--panelist-color);
  margin-bottom: var(--space-sm);
}
.card-body { margin-bottom: var(--space-xs); }
.card-name {
  font-size: var(--text-base);
  font-weight: var(--font-semibold);
}
.card-profession {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  margin-top: 2px;
}
.card-stance {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  margin-top: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.card-focus {
  font-size: var(--text-xs);
  color: var(--panelist-color);
  font-style: italic;
  margin-top: var(--space-xs);
}

/* ── 替换 ── */
.replace-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: var(--space-sm);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  transition: color var(--duration-fast);
}
.replace-btn:hover { color: var(--text-primary); }
.replace-overlay {
  position: absolute;
  inset: 0;
  border-radius: var(--radius-lg);
  background: rgba(11, 11, 20, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  z-index: 2;
}
.spinning { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* 手机紧凑模式 (DDD §09-responsive-design §4) */
@media (max-width: 767px) {
  .expert-card {
    width: 100%;
    min-width: 0;
    padding: var(--space-sm) var(--space-md);
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }
  .color-block {
    width: 6px; height: 32px;
    margin-bottom: 0;
  }
  .card-body {
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }
  .card-name { font-size: var(--text-sm); }
  .card-profession { display: none; }
  .card-stance { display: none; }
  .card-focus { margin-top: 0; }
}
</style>
