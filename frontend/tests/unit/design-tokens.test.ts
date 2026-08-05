// UT-06 — Design Token 常量校验
import { describe, it, expect } from 'vitest'
import { DISCUSSION, WS, TOAST, TRANSCRIPT } from '@/constants/design-tokens'

describe('DISCUSSION', () => {
  it('专家人数范围 4–8，默认 4', () => {
    expect(DISCUSSION.minExperts).toBe(4)
    expect(DISCUSSION.maxExperts).toBe(8)
    expect(DISCUSSION.defaultExperts).toBe(4)
  })

  it('话题最大长度 200', () => {
    expect(DISCUSSION.maxTopicLength).toBe(200)
  })
})

describe('WS', () => {
  it('重连延迟为 1s/2s/4s 指数退避', () => {
    expect(WS.reconnectDelays).toEqual([1000, 2000, 4000])
  })

  it('最多重连 3 次', () => {
    expect(WS.maxReconnectAttempts).toBe(3)
  })

  it('僵尸超时 30s', () => {
    expect(WS.zombieTimeout).toBe(30000)
  })
})

describe('TOAST', () => {
  it('最多堆叠 3 条', () => {
    expect(TOAST.maxStack).toBe(3)
  })
})

describe('TRANSCRIPT', () => {
  it('自动滚动阈值 50px', () => {
    expect(TRANSCRIPT.autoScrollThreshold).toBe(50)
  })
})
