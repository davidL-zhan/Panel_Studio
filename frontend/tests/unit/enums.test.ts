// UT-01..04 — 枚举值校验 (对应 SDD §01-domain-model)
import { describe, it, expect } from 'vitest'
import {
  DiscussionStatus,
  PanelistRole,
  PanelistStatus,
  MessageType,
  ConsensusType,
  WsConnectionStatus,
} from '@/types/enums'

describe('DiscussionStatus', () => {
  it('包含全部 4 个状态值', () => {
    const values = Object.values(DiscussionStatus)
    expect(values).toHaveLength(4)
    expect(values).toContain('PENDING_PANEL')
    expect(values).toContain('PANEL_READY')
    expect(values).toContain('IN_PROGRESS')
    expect(values).toContain('ENDED')
  })
})

describe('PanelistStatus', () => {
  it('包含全部 3 个状态值', () => {
    const values = Object.values(PanelistStatus)
    expect(values).toHaveLength(3)
    expect(values).toContain('STANDBY')
    expect(values).toContain('PREPARING')
    expect(values).toContain('SPEAKING')
  })
})

describe('MessageType', () => {
  it('包含 SUMMARY——确保不被遗漏', () => {
    const values = Object.values(MessageType)
    expect(values).toHaveLength(7)
    expect(values).toContain('SUMMARY')
    expect(values).toContain('OPENING')
    expect(values).toContain('REBUTTAL')
  })
})

describe('ConsensusType', () => {
  it('包含 CONSENSUS 和 DISAGREEMENT', () => {
    const values = Object.values(ConsensusType)
    expect(values).toEqual(['CONSENSUS', 'DISAGREEMENT'])
  })
})

describe('PanelistRole', () => {
  it('仅有 HOST 和 EXPERT', () => {
    expect(PanelistRole.HOST).toBe('HOST')
    expect(PanelistRole.EXPERT).toBe('EXPERT')
  })
})

describe('WsConnectionStatus', () => {
  it('包含全部 4 个连接状态', () => {
    const values = Object.values(WsConnectionStatus)
    expect(values).toHaveLength(4)
    expect(values).toContain('disconnected')
    expect(values).toContain('connected')
    expect(values).toContain('connecting')
    expect(values).toContain('reconnecting')
  })
})
