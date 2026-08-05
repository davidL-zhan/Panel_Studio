// Mock API 层 — VITE_MOCK=true 时拦截端点调用，返回 mock 数据
import { ApiError } from '@/types/api'
import { DiscussionStatus, PanelistRole } from '@/types/enums'
import { mockDiscussions, mockPanelists, mockMessages, mockConsensus } from './data'
import type { Discussion, Panelist } from '@/types/domain'
import { assignColors } from '@/constants/panelist-colors'

const discussions: Discussion[] = structuredClone(mockDiscussions)
const panelistsMap = structuredClone(mockPanelists)
const messagesMap = structuredClone(mockMessages)
const consensusMap = structuredClone(mockConsensus)

function delay(ms = 300) { return new Promise((r) => setTimeout(r, ms)) }
function ok<T>(data: T) { return { data } }
function notFound(): never { throw new ApiError(404, '讨论不存在') }
function conflict(msg: string): never { throw new ApiError(409, msg) }

function mustFind<T>(arr: T[], pred: (x: T) => boolean, onMissing: () => never): T {
  const item = arr.find(pred)
  if (!item) onMissing()
  return item
}

// ── 讨论管理 ────────────────────────
export async function fetchDiscussions() {
  await delay()
  return ok(discussions.map(({ id, topic, expert_count, status, created_at, updated_at }) =>
    ({ id, topic, expert_count, status, created_at, updated_at })))
}

export async function createDiscussion(body: { topic: string; expert_count?: number }) {
  await delay(500)
  if (!body.topic || body.topic.length > 200) throw new ApiError(422, '话题长度须在 1–200 字符之间')
  const ec = Math.max(4, Math.min(8, body.expert_count ?? 4))
  const d: Discussion = {
    id: `d-${Date.now()}`, topic: body.topic, expert_count: ec,
    status: DiscussionStatus.PENDING_PANEL,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  }
  discussions.unshift(d)
  return ok(d)
}

export async function fetchDiscussion(id: string) {
  await delay()
  const d = mustFind(discussions, (x) => x.id === id, notFound)
  const panelists = panelistsMap[id] ?? []
  const latest_messages = messagesMap[id]?.slice(-20) ?? []
  const consensus_points = consensusMap[id] ?? []
  return ok({ ...d, panelists, latest_messages, consensus_points })
}

export async function deleteDiscussion(id: string) {
  await delay()
  const idx = discussions.findIndex((x) => x.id === id)
  if (idx === -1) notFound()
  discussions.splice(idx, 1)
  return { data: undefined, status: 204 as const }
}

// ── 嘉宾管理 ────────────────────────
export async function generatePanel(id: string) {
  await delay(800)
  const d = mustFind(discussions, (x) => x.id === id, notFound)
  if (d.status !== DiscussionStatus.PENDING_PANEL) conflict('仅 PENDING_PANEL 状态可生成嘉宾')
  const colors = assignColors(d.expert_count)
  const names = ['张教授', '李博士', '王老师', '陈总', '赵顾问', '刘研究员', '孙工', '周主任']
  const host: Panelist = {
    id: `${id}-host`, discussion_id: id, name: '主持人', role: PanelistRole.HOST,
    profession: '科技媒体主编', title: '资深圆桌主持人', stance: '中立主持',
    color: '#4ECDC4', status: 'STANDBY' as Panelist['status'], current_focus: null, sort_order: 0,
  }
  const experts: Panelist[] = Array.from({ length: d.expert_count }, (_, i) => ({
    id: `${id}-e${i}`, discussion_id: id, name: names[i] ?? `专家${i + 1}`,
    role: PanelistRole.EXPERT, profession: '领域专家', title: `${d.topic.slice(0, 6)}研究员`,
    stance: `立场 ${i + 1}`, color: colors[i], status: 'STANDBY' as Panelist['status'],
    current_focus: null, sort_order: i + 1,
  }))
  panelistsMap[id] = [host, ...experts]
  d.status = DiscussionStatus.PANEL_READY
  d.updated_at = new Date().toISOString()
  return ok({ host, experts })
}

export async function replaceExpert(discussionId: string, panelistId: string) {
  await delay(600)
  const panelists = panelistsMap[discussionId]
  if (!panelists) notFound()
  const idx = panelists.findIndex((p) => p.id === panelistId)
  if (idx === -1) throw new ApiError(404, '嘉宾不存在')
  if (panelists[idx].role === PanelistRole.HOST) throw new ApiError(400, '不能替换主持人')
  panelists[idx] = {
    ...panelists[idx],
    name: `替代专家-${Date.now().toString(36)}`,
    profession: '替代职业', title: '替代头衔',
    stance: `替代立场 (${Date.now() % 100})`,
  }
  return ok(panelists[idx])
}

export async function regeneratePanel(id: string) {
  await delay(800)
  return generatePanel(id)
}

// ── 讨论控制 ────────────────────────
export async function startDiscussion(id: string) {
  await delay(300)
  const d = mustFind(discussions, (x) => x.id === id, notFound)
  if (d.status !== DiscussionStatus.PANEL_READY) conflict('仅 PANEL_READY 状态可开始讨论')
  d.status = DiscussionStatus.IN_PROGRESS
  d.updated_at = new Date().toISOString()
  return ok({ status: DiscussionStatus.IN_PROGRESS, message: '讨论已开始' })
}

export async function endDiscussion(id: string) {
  await delay(1000)
  const d = mustFind(discussions, (x) => x.id === id, notFound)
  if (d.status === DiscussionStatus.ENDED) {
    return ok({ status: DiscussionStatus.ENDED, summary: '(已有总结) 本次讨论围绕核心议题展开了深入探讨。' })
  }
  if (d.status !== DiscussionStatus.IN_PROGRESS) conflict('仅 IN_PROGRESS 状态可结束讨论')
  d.status = DiscussionStatus.ENDED
  d.updated_at = new Date().toISOString()
  return ok({ status: DiscussionStatus.ENDED, summary: '本次讨论围绕核心议题展开了深入探讨。专家们从多个维度进行了观点碰撞，既达成了部分共识，也存在根本性的分歧。感谢各位的参与！' })
}

export { discussions, panelistsMap, messagesMap, consensusMap }
