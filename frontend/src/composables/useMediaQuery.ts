// DDD §09-responsive-design.md §1 — 响应式断点检测
import { ref, onMounted, onUnmounted } from 'vue'
import { BREAKPOINTS } from '@/constants/design-tokens'

export function useMediaQuery() {
  const isMobile = ref(false)
  const isTablet = ref(false)
  const isDesktop = ref(false)

  let cleanup: (() => void) | null = null

  function update() {
    const w = window.innerWidth
    isMobile.value = w < BREAKPOINTS.mobile
    isTablet.value = w >= BREAKPOINTS.mobile && w < BREAKPOINTS.tablet
    isDesktop.value = w >= BREAKPOINTS.tablet
  }

  onMounted(() => {
    update()
    window.addEventListener('resize', update)
    cleanup = () => window.removeEventListener('resize', update)
  })

  onUnmounted(() => { cleanup?.() })

  return { isMobile, isTablet, isDesktop }
}
