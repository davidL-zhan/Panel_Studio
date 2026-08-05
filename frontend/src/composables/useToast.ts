// 全局 Toast 调用入口 — provide/inject 模式
import { inject } from 'vue'
import type { ToastMessage } from '@/components/shared/GlobalToast.vue'

interface ToastAPI {
  addToast: (message: string, variant?: ToastMessage['variant']) => void
  removeToast: (id: number) => void
}

export const TOAST_KEY = Symbol('toast')

export function useToast(): ToastAPI {
  const api = inject<ToastAPI>(TOAST_KEY)
  if (!api) {
    // fallback: 未挂载时静默输出到 console
    return {
      addToast: (msg, variant) => console.warn(`[Toast fallback][${variant}] ${msg}`),
      removeToast: () => {},
    }
  }
  return api
}
