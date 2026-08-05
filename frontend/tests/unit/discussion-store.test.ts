// UT-28..35 — DiscussionStore 核心逻辑测试 (对应 SDD §04-page-state-matrix)
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDiscussionStore } from '@/stores/discussion'
import { DiscussionStatus, PanelistRole, PanelistStatus, MessageType, ConsensusType } from '@/types/enums'
import type { Panelist, Message, ConsensusPoint } from '@/types/domain'

function makePanelist(overrides: Partial<Panelist> = {}): Panelist {
  return {
    id: 'p1', discussion_id: 'd1', name: '测试', role: PanelistRole.EXPERT,
    profession: '职业', title: '头衔', stance: '立场', color: '#FF6B6B',
    status: PanelistStatus.STANDBY, current_focus: null, sort_order: 1,
    ...overrides,
  }
}

function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 'm1', discussion_id: 'd1', panelist_id: 'p1',
    panelist_name: '测试', panelist_title: '头衔', panelist_color: '#FF6B6B',
    content: '发言内容', message_type: MessageType.ANSWER,
    sequence: 1, created_at: new Date().toISOString(),
    ...overrides,
  }
}

describe('useDiscussionStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('初始化状态为空', () => {
    const store = useDiscussionStore()
    expect(store.discussion).toBeNull()
    expect(store.panelists).toEqual([])
    expect(store.messages).toEqual([])
    expect(store.consensusPoints).toEqual([])
    expect(store.loading).toBe(false)
  })

  it('handlePanelistStatus 更新嘉宾状态', () => {
    const store = useDiscussionStore()
    store.panelists = [
      makePanelist({ id: 'p1', status: PanelistStatus.STANDBY }),
      makePanelist({ id: 'p2', status: PanelistStatus.STANDBY }),
    ]

    store.handlePanelistStatus({
      panelists: [
        { id: 'p1', status: PanelistStatus.SPEAKING, current_focus: '正在发言' },
        { id: 'p2', status: PanelistStatus.PREPARING, current_focus: '准备反驳' },
      ],
    })

    expect(store.panelists[0].status).toBe(PanelistStatus.SPEAKING)
    expect(store.panelists[0].current_focus).toBe('正在发言')
    expect(store.panelists[1].status).toBe(PanelistStatus.PREPARING)
  })

  it('handleNewMessage 追加发言', () => {
    const store = useDiscussionStore()
    expect(store.messages).toHaveLength(0)

    store.handleNewMessage(makeMessage({ sequence: 1 }))
    store.handleNewMessage(makeMessage({ id: 'm2', sequence: 2 }))

    expect(store.messages).toHaveLength(2)
    expect(store.messages[1].sequence).toBe(2)
  })

  it('handleConsensusUpdate 全量替换共识', () => {
    const store = useDiscussionStore()
    store.consensusPoints = [
      { id: 'c1', discussion_id: 'd1', point_type: ConsensusType.CONSENSUS, content: '旧共识', message_range_start: 1, message_range_end: 3, generated_at: '' },
    ]

    const newPoints: ConsensusPoint[] = [
      { id: 'c2', discussion_id: 'd1', point_type: ConsensusType.DISAGREEMENT, content: '新分歧', message_range_start: 1, message_range_end: 4, generated_at: '' },
      { id: 'c3', discussion_id: 'd1', point_type: ConsensusType.CONSENSUS, content: '新共识', message_range_start: 2, message_range_end: 5, generated_at: '' },
    ]
    store.handleConsensusUpdate({ points: newPoints })

    expect(store.consensusPoints).toHaveLength(2)
    expect(store.consensusPoints[0].content).toBe('新分歧')
  })

  it('handleDiscussionEnded 标记结束', () => {
    const store = useDiscussionStore()
    store.discussion = {
      id: 'd1', topic: '测试', expert_count: 4, status: DiscussionStatus.IN_PROGRESS,
      created_at: '', updated_at: '',
    }
    store.handleDiscussionEnded()
    expect(store.discussion.status).toBe(DiscussionStatus.ENDED)
  })

  it('host 派生值正确过滤主持人', () => {
    const store = useDiscussionStore()
    store.panelists = [
      makePanelist({ id: 'host', role: PanelistRole.HOST, name: '主持人' }),
      makePanelist({ id: 'e1', role: PanelistRole.EXPERT, name: '专家1' }),
    ]
    expect(store.host?.name).toBe('主持人')
    expect(store.experts).toHaveLength(1)
  })

  it('currentSpeaker 返回 SPEAKING 状态的嘉宾', () => {
    const store = useDiscussionStore()
    store.panelists = [
      makePanelist({ id: 'p1', status: PanelistStatus.STANDBY }),
      makePanelist({ id: 'p2', status: PanelistStatus.SPEAKING, name: '发言人' }),
    ]
    expect(store.currentSpeaker?.name).toBe('发言人')
  })

  it('reset 清空所有状态', () => {
    const store = useDiscussionStore()
    store.discussion = { id: 'd1', topic: 'x', expert_count: 4, status: DiscussionStatus.IN_PROGRESS, created_at: '', updated_at: '' }
    store.panelists = [makePanelist()]
    store.messages = [makeMessage()]
    store.reset()
    expect(store.discussion).toBeNull()
    expect(store.panelists).toEqual([])
    expect(store.messages).toEqual([])
  })
})
