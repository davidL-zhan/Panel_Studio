// Mock WebSocket Server — 模拟完整讨论生命周期的事件发射
// DDD §08-interaction-specification §3 — WS 连接管理
import type { Panelist, Message, ConsensusPoint } from '@/types/domain'
import type { WsEnvelope, WsPanelistStatus } from '@/types/websocket'
import { DiscussionStatus, PanelistStatus, MessageType, ConsensusType } from '@/types/enums'

export type WsEventHandler = (envelope: WsEnvelope) => void

export class MockWsServer {
  private handler: WsEventHandler | null = null
  private seq = 0
  private running = false
  private timer: ReturnType<typeof setTimeout> | null = null
  private panelists: Panelist[] = []
  private messages: Message[] = []
  private consensusPoints: ConsensusPoint[] = []

  // 预设发言序列 (演示用)
  private readonly script: Array<{
    speakerId: string
    content: string
    type: MessageType
    delay: number
  }> = []

  connect(handler: WsEventHandler) {
    this.handler = handler
    this.seq = 0
    this.running = true
  }

  disconnect() {
    this.running = false
    if (this.timer) { clearTimeout(this.timer); this.timer = null }
    this.handler = null
  }

  // 设置讨论上下文
  setup(
    panelists: Panelist[],
    existingMessages: Message[],
    existingConsensus: ConsensusPoint[],
  ) {
    this.panelists = [...panelists]
    this.messages = [...existingMessages]
    this.consensusPoints = [...existingConsensus]

    // 仅当无历史消息时生成演示发言
    if (this.messages.length === 0) {
      this.buildScript()
    }
  }

  // 开始模拟讨论
  start() {
    if (!this.running || !this.handler) return

    // 1. initial_state
    this.emit('initial_state', {
      discussion_status: DiscussionStatus.IN_PROGRESS,
      latest_messages: this.messages.slice(-20),
      consensus_points: this.consensusPoints,
      panelists: this.panelists,
    })

    // 2. discussion_started
    setTimeout(() => {
      this.emit('discussion_started', { topic: '', panelist_count: this.panelists.length })
    }, 300)

    // 3. 按 script 序列发射发言
    if (this.script.length > 0) {
      this.runScript(0)
    }
  }

  // 结束讨论：发射 summary
  end() {
    this.running = false
    if (this.timer) { clearTimeout(this.timer); this.timer = null }
    if (this.handler) {
      this.emit('discussion_ended', {
        summary: '感谢各位专家的精彩讨论。今天我们围绕核心议题展开了深入对话，从多个角度进行了观点碰撞。既有共识，也有值得继续探讨的分歧。期待下一次圆桌讨论。',
        total_messages: this.messages.length,
      })
    }
  }

  // ── 内部 ──────────────────────────
  private emit<T extends WsEnvelope['data']>(event: WsEnvelope['event'], data: T) {
    if (!this.handler) return
    this.seq++
    this.handler({ event, sequence_id: this.seq, data, timestamp: new Date().toISOString() })
  }

  private buildScript() {
    const experts = this.panelists.filter((p) => p.role === 'EXPERT')
    if (experts.length < 2) return
    const host = this.panelists.find((p) => p.role === 'HOST')

    const hostId = host?.id ?? ''

    this.script.push(
      // 主持人开场
      { speakerId: hostId, content: '各位观众晚上好，欢迎来到今天的 AI 圆桌讨论。我们邀请了多位来自不同领域的专家，今天将围绕这个话题展开深入交流。让我们先听听各位专家的初步观点。', type: MessageType.OPENING, delay: 800 },
      // 专家 1 发言
      { speakerId: experts[0].id, content: `关于这个话题，我认为我们需要从多个维度来审视。${experts[0].name}的观点是——技术发展不可阻挡，我们应该积极拥抱变化。`, type: MessageType.ANSWER, delay: 2500 },
      // 专家 2 反驳
      { speakerId: experts[1].id, content: `我部分同意${experts[0].name}的看法，但我认为我们忽视了一个关键因素——人文关怀和社会影响。技术不是中立的。`, type: MessageType.SUPPLEMENT, delay: 3000 },
      // 主持人追问
      { speakerId: hostId, content: `很有意思的对立。${experts.length > 2 ? experts[2].name + '，您怎么看待这两种观点？' : '还有哪位专家想补充？'}`, type: MessageType.QUESTION, delay: 2500 },
      // 专家 3 发言
      { speakerId: experts[Math.min(2, experts.length - 1)].id, content: '我认为这两种观点并非完全对立。关键在于我们如何平衡——在推动技术进步的同时建立相应的伦理框架和社会规范。', type: MessageType.ANSWER, delay: 2800 },
    )

    // 共识提炼（在第 3 条后触发）
  }

  private runScript(idx: number) {
    if (!this.running || idx >= this.script.length) return
    const line = this.script[idx]

    this.timer = setTimeout(() => {
      if (!this.running || !this.handler) return

      const speaker = this.panelists.find((p) => p.id === line.speakerId)
      if (!speaker) { this.runScript(idx + 1); return }

      // 1. 更新嘉宾状态 → 当前发言人 SPEAKING
      const statuses: WsPanelistStatus['panelists'] = this.panelists.map((p) => ({
        id: p.id,
        status: p.id === line.speakerId ? PanelistStatus.SPEAKING : PanelistStatus.STANDBY,
        current_focus: p.id === line.speakerId ? `正在回应${idx === 0 ? '开场' : '前面的讨论'}` : null,
      }))
      this.emit('panelist_status', { panelists: statuses })

      // 短暂延迟后发言
      setTimeout(() => {
        if (!this.running) return
        const seq = this.messages.length + 1
        const msg: Message = {
          id: `mock-msg-${seq}`,
          discussion_id: speaker.discussion_id,
          panelist_id: speaker.id,
          panelist_name: speaker.name,
          panelist_title: speaker.title,
          panelist_color: speaker.color,
          content: line.content,
          message_type: line.type,
          sequence: seq,
          created_at: new Date().toISOString(),
        }
        this.messages.push(msg)
        this.emit('new_message', { message: msg })

        // 讲话者恢复 STANDBY
        const updated: WsPanelistStatus['panelists'] = this.panelists.map((p) => ({
          id: p.id,
          status: PanelistStatus.STANDBY,
          current_focus: null,
        }))
        this.emit('panelist_status', { panelists: updated })

        // 每 3-5 条后提炼共识
        if (this.messages.length > 0 && this.messages.length % 4 === 0) {
          this.emitConsensus()
        }

        this.runScript(idx + 1)
      }, 600)
    }, line.delay)
  }

  private emitConsensus() {
    const count = this.consensusPoints.length
    const newPoint: ConsensusPoint = {
      id: `mock-cp-${count + 1}`,
      discussion_id: this.panelists[0]?.discussion_id ?? '',
      point_type: count % 2 === 0 ? ConsensusType.CONSENSUS : ConsensusType.DISAGREEMENT,
      content: count % 2 === 0
        ? `专家们就核心议题的基本判断达成初步共识`
        : `在具体实施路径上存在不同意见`,
      message_range_start: Math.max(1, this.messages.length - 3),
      message_range_end: this.messages.length,
      generated_at: new Date().toISOString(),
    }
    this.consensusPoints.push(newPoint)
    this.emit('consensus_update', { points: [...this.consensusPoints] })
  }
}
