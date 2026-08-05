// CT-11 — WsConnectionIndicator 三态 (对应 DDD §04-page-state-matrix §4.2)
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { WsConnectionStatus } from '@/types/enums'
import WsConnectionIndicator from '@/components/layout/WsConnectionIndicator.vue'

describe('WsConnectionIndicator', () => {
  it('CONNECTED → 绿色圆点 + 已连接', () => {
    const wrapper = mount(WsConnectionIndicator, {
      props: { status: WsConnectionStatus.CONNECTED },
    })
    expect(wrapper.find('.dot-green').exists()).toBe(true)
    expect(wrapper.text()).toContain('已连接')
  })

  it('RECONNECTING → 黄色闪烁 + 重连中', () => {
    const wrapper = mount(WsConnectionIndicator, {
      props: { status: WsConnectionStatus.RECONNECTING },
    })
    expect(wrapper.find('.dot-yellow').exists()).toBe(true)
    expect(wrapper.text()).toContain('重连中')
  })

  it('DISCONNECTED → 红色圆点 + 已断开', () => {
    const wrapper = mount(WsConnectionIndicator, {
      props: { status: WsConnectionStatus.DISCONNECTED },
    })
    expect(wrapper.find('.dot-red').exists()).toBe(true)
    expect(wrapper.text()).toContain('已断开')
  })
})
