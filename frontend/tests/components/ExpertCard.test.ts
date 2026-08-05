// CT-03 — ExpertCard 三态视觉 (对应 DDD §04-page-state-matrix §5)
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ExpertCard from '@/components/panel/ExpertCard.vue'
import { PanelistRole, PanelistStatus } from '@/types/enums'
import type { Panelist } from '@/types/domain'

function makePanelist(overrides: Partial<Panelist> = {}): Panelist {
  return {
    id: 'p1', discussion_id: 'd1', name: '测试专家',
    role: PanelistRole.EXPERT, profession: 'AI 研究员', title: '前 OpenAI 科学家',
    stance: 'AI 将极大拓展人类创造力边界', color: '#FF6B6B',
    status: PanelistStatus.STANDBY, current_focus: null, sort_order: 1,
    ...overrides,
  }
}

describe('ExpertCard', () => {
  it('STANDBY 状态 — opacity 0.7', () => {
    const wrapper = mount(ExpertCard, {
      props: { panelist: makePanelist({ status: PanelistStatus.STANDBY }) },
    })
    expect(wrapper.attributes('data-status')).toBe('STANDBY')
  })

  it('PREPARING 状态 — 边框微亮，无动画', () => {
    const wrapper = mount(ExpertCard, {
      props: { panelist: makePanelist({ status: PanelistStatus.PREPARING }) },
    })
    expect(wrapper.attributes('data-status')).toBe('PREPARING')
    // 静态样式：无 pulse/breath 动画类
    expect(wrapper.find('.expert-card').classes()).not.toContain('pulse')
  })

  it('SPEAKING 状态 — 边框 2px + 背景微提亮，无脉冲', () => {
    const wrapper = mount(ExpertCard, {
      props: { panelist: makePanelist({ status: PanelistStatus.SPEAKING }) },
    })
    expect(wrapper.attributes('data-status')).toBe('SPEAKING')
  })

  it('渲染嘉宾信息', () => {
    const wrapper = mount(ExpertCard, {
      props: { panelist: makePanelist() },
    })
    expect(wrapper.text()).toContain('测试专家')
    expect(wrapper.text()).toContain('AI 研究员')
  })

  it('showReplace 为 true 时显示替换按钮', () => {
    const wrapper = mount(ExpertCard, {
      props: { panelist: makePanelist(), showReplace: true },
    })
    expect(wrapper.text()).toContain('替换')
  })

  it('showReplace 为 false 时不显示替换按钮', () => {
    const wrapper = mount(ExpertCard, {
      props: { panelist: makePanelist(), showReplace: false },
    })
    expect(wrapper.text()).not.toContain('替换')
  })

  it('replacing 为 true 时显示遮罩', () => {
    const wrapper = mount(ExpertCard, {
      props: { panelist: makePanelist(), replacing: true },
    })
    expect(wrapper.find('.replace-overlay').exists()).toBe(true)
  })
})
