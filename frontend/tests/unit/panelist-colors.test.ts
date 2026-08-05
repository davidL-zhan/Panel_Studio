// UT-05 — 嘉宾色板校验 (对应 SDD §04-llm-protocol §3.5)
import { describe, it, expect } from 'vitest'
import { PANELIST_COLORS, HOST_COLOR, assignColors } from '@/constants/panelist-colors'

describe('PANELIST_COLORS', () => {
  it('有 10 种颜色，无重复', () => {
    expect(PANELIST_COLORS).toHaveLength(10)
    expect(new Set(PANELIST_COLORS).size).toBe(10)
  })

  it('主持人颜色为 #4ECDC4', () => {
    expect(HOST_COLOR).toBe('#4ECDC4')
  })

  it('所有颜色为合法 hex 格式', () => {
    for (const c of PANELIST_COLORS) {
      expect(c).toMatch(/^#[0-9A-Fa-f]{6}$/)
    }
  })
})

describe('assignColors', () => {
  it('4 位专家返回 4 色，不含主持人色', () => {
    const colors = assignColors(4)
    expect(colors).toHaveLength(4)
    expect(colors).not.toContain(HOST_COLOR)
    expect(new Set(colors).size).toBe(4)
  })

  it('8 位专家返回 8 色（含兜底取模）', () => {
    const colors = assignColors(8)
    expect(colors).toHaveLength(8)
    expect(new Set(colors).size).toBe(8) // 9 个非主持色，够 8 用
  })
})
