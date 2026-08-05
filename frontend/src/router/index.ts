// DDD §02-information-architecture.md §1 — 页面路由
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomePage.vue'),
    },
    {
      path: '/discussions/:id',
      name: 'discussion',
      component: () => import('@/views/DiscussionPage.vue'),
      props: true,
    },
  ],
})

export default router
