<!-- DDD §07-component-architecture.md §1 — 根组件 -->
<script setup lang="ts">
// 根组件仅承载 <router-view> + 全局共享组件
// 后续 DDD-2 将在此挂载 GlobalToast、ConfirmDialog
</script>

<template>
  <router-view />
</template>
