<!-- DDD §07-component-architecture.md §1 — 根组件 -->
<script setup lang="ts">
import { ref, provide } from 'vue'
import GlobalToast from '@/components/shared/GlobalToast.vue'
import { TOAST_KEY } from '@/composables/useToast'

const toastRef = ref<InstanceType<typeof GlobalToast> | null>(null)

function addToast(message: string, variant: 'success' | 'warning' | 'error' | 'info' = 'info') {
  toastRef.value?.addToast(message, variant)
}
function removeToast(id: number) {
  toastRef.value?.removeToast(id)
}

provide(TOAST_KEY, { addToast, removeToast })
</script>

<template>
  <router-view />
  <GlobalToast ref="toastRef" />
</template>
