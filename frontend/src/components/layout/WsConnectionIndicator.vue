<!-- DDD §04-page-state-matrix §4.2 — WS 连接状态指示器
  三态：绿(已连接) · 黄闪烁(重连中) · 红(已断开) -->
<script setup lang="ts">
import { computed } from 'vue'
import { Wifi, WifiOff } from 'lucide-vue-next'
import { WsConnectionStatus } from '@/types/enums'

const props = defineProps<{ status: WsConnectionStatus }>()

const label = computed(() => ({
  [WsConnectionStatus.CONNECTED]: '已连接',
  [WsConnectionStatus.CONNECTING]: '连接中',
  [WsConnectionStatus.RECONNECTING]: '重连中...',
  [WsConnectionStatus.DISCONNECTED]: '已断开',
}[props.status]))

const dotClass = computed(() => ({
  [WsConnectionStatus.CONNECTED]: 'dot-green',
  [WsConnectionStatus.CONNECTING]: 'dot-yellow',
  [WsConnectionStatus.RECONNECTING]: 'dot-yellow blink',
  [WsConnectionStatus.DISCONNECTED]: 'dot-red',
}[props.status]))
</script>

<template>
  <div class="ws-indicator" :aria-label="`连接状态：${label}`">
    <span class="dot" :class="dotClass" />
    <Wifi v-if="status === WsConnectionStatus.CONNECTED" :size="14" />
    <WifiOff v-else :size="14" />
    <span class="label">{{ label }}</span>
  </div>
</template>

<style scoped>
.ws-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-xs);
  color: var(--text-secondary);
}
.dot {
  width: 8px; height: 8px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}
.dot-green  { background: var(--color-success); }
.dot-yellow { background: var(--color-warning); }
.dot-red    { background: var(--color-error); }
.blink { animation: blink 1s ease-in-out infinite; }
@keyframes blink {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.3; }
}
.label { white-space: nowrap; }
</style>
