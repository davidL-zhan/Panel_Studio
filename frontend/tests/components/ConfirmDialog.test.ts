// CT-12 — ConfirmDialog (Teleport → body)
import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue'

afterEach(() => {
  document.body.innerHTML = ''
})

function mountDialog(overrides: Record<string, unknown> = {}) {
  return mount(ConfirmDialog, {
    props: { open: true, title: '测试标题', message: '测试消息', ...overrides },
    attachTo: document.body,
  })
}

describe('ConfirmDialog', () => {
  it('open=false 时不渲染', () => {
    const wrapper = mount(ConfirmDialog, {
      props: { open: false, title: 'T', message: 'M' },
      attachTo: document.body,
    })
    expect(document.body.querySelector('[role="dialog"]')).toBeNull()
  })

  it('open=true 时渲染到 body', () => {
    mountDialog()
    const dialog = document.body.querySelector('[role="dialog"]')!
    expect(dialog).not.toBeNull()
    expect(dialog.textContent).toContain('测试标题')
    expect(dialog.textContent).toContain('测试消息')
  })

  it('点击取消 → emit cancel', async () => {
    const wrapper = mountDialog()
    const btn = document.body.querySelector<HTMLButtonElement>('.btn-secondary')!
    await btn.click()
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('点击确认 → emit confirm', async () => {
    const wrapper = mountDialog()
    const btn = document.body.querySelector<HTMLButtonElement>('.btn-primary')!
    await btn.click()
    expect(wrapper.emitted('confirm')).toBeTruthy()
  })

  it('Escape → emit cancel', async () => {
    const wrapper = mountDialog()
    const dialog = document.body.querySelector('[role="dialog"]')!
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('点击遮罩 → emit cancel', async () => {
    const wrapper = mountDialog()
    const overlay = document.body.querySelector('.dialog-overlay') as HTMLElement
    await overlay.click()
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('danger variant → 红色按钮', () => {
    mountDialog({ variant: 'danger', confirmLabel: '删除' })
    const btn = document.body.querySelector('.btn-danger')!
    expect(btn).not.toBeNull()
    expect(btn.textContent).toBe('删除')
  })
})
