// Mock 数据 — 5 条预设讨论 (SDD 交付物要求 §样例数据)
import { DiscussionStatus, PanelistRole, PanelistStatus, MessageType, ConsensusType } from '@/types/enums'
import type { Discussion, Panelist, Message, ConsensusPoint } from '@/types/domain'
import { assignColors } from '@/constants/panelist-colors'

const ago = (m: number) => new Date(Date.now() - m * 60000).toISOString()
const colors4 = assignColors(4)
const colors5 = assignColors(5)
const colors6 = assignColors(6)

// ── 讨论 1: IN_PROGRESS ───────────────────
const d1: Discussion = {
  id: 'd1-ai-creativity',
  topic: 'AI 会取代人类创造力吗？',
  expert_count: 5, status: DiscussionStatus.IN_PROGRESS,
  created_at: ago(30), updated_at: ago(1),
}

const p1: Panelist[] = [
  { id: 'd1-host', discussion_id: d1.id, name: '张明远', role: PanelistRole.HOST, profession: '科技媒体主编', title: '资深圆桌主持人', stance: '中立主持', color: '#4ECDC4', status: PanelistStatus.STANDBY, current_focus: null, sort_order: 0 },
  { id: 'd1-e1', discussion_id: d1.id, name: '李思涵', role: PanelistRole.EXPERT, profession: 'AI 研究员', title: '前 OpenAI 科学家', stance: 'AI 将极大拓展人类创造力边界', color: colors5[0], status: PanelistStatus.STANDBY, current_focus: null, sort_order: 1 },
  { id: 'd1-e2', discussion_id: d1.id, name: '王翰文', role: PanelistRole.EXPERT, profession: '当代艺术家', title: '中央美院教授', stance: '创造力是人类独有的精神活动', color: colors5[1], status: PanelistStatus.STANDBY, current_focus: null, sort_order: 2 },
  { id: 'd1-e3', discussion_id: d1.id, name: '陈思远', role: PanelistRole.EXPERT, profession: '哲学家', title: '北大哲学系研究员', stance: '创造力定义本身需要重新审视', color: colors5[2], status: PanelistStatus.STANDBY, current_focus: null, sort_order: 3 },
  { id: 'd1-e4', discussion_id: d1.id, name: '刘晓峰', role: PanelistRole.EXPERT, profession: '企业家', title: '某 AI 创业公司 CEO', stance: 'AI 是工具，创造力始终在人', color: colors5[3], status: PanelistStatus.STANDBY, current_focus: null, sort_order: 4 },
  { id: 'd1-e5', discussion_id: d1.id, name: '赵敏', role: PanelistRole.EXPERT, profession: '教育学家', title: '华东师大学前教育专家', stance: 'AI 应辅助而非替代创造性教育', color: colors5[4], status: PanelistStatus.STANDBY, current_focus: null, sort_order: 5 },
]

const m1: Message[] = [
  { id: 'm1-1', discussion_id: d1.id, panelist_id: 'd1-host', panelist_name: '张明远', panelist_title: '资深圆桌主持人', panelist_color: '#4ECDC4', content: '各位观众晚上好，欢迎来到今天的 AI 圆桌讨论。今天的话题是"AI 会取代人类创造力吗？"，我们邀请了五位来自不同领域的专家。', message_type: MessageType.OPENING, sequence: 1, created_at: ago(20) },
  { id: 'm1-2', discussion_id: d1.id, panelist_id: 'd1-e1', panelist_name: '李思涵', panelist_title: '前 OpenAI 科学家', panelist_color: colors5[0], content: '我认为 AI 不是在取代创造力，而是在放大人类的创造潜能。GPT 系列已经证明了语言模型可以生成令人惊叹的创意内容。', message_type: MessageType.ANSWER, sequence: 2, created_at: ago(18) },
  { id: 'm1-3', discussion_id: d1.id, panelist_id: 'd1-e2', panelist_name: '王翰文', panelist_title: '中央美院教授', panelist_color: colors5[1], content: '我不同意。艺术创作中的情感体验、生命感悟是算法无法模拟的。AI 生成的画作再精美，也缺少灵魂。', message_type: MessageType.REBUTTAL, sequence: 3, created_at: ago(16) },
  { id: 'm1-4', discussion_id: d1.id, panelist_id: 'd1-host', panelist_name: '张明远', panelist_title: '资深圆桌主持人', panelist_color: '#4ECDC4', content: '有意思的对立。陈老师，您作为哲学家怎么看待这个问题？', message_type: MessageType.QUESTION, sequence: 4, created_at: ago(14) },
  { id: 'm1-5', discussion_id: d1.id, panelist_id: 'd1-e3', panelist_name: '陈思远', panelist_title: '北大哲学系研究员', panelist_color: colors5[2], content: '我们需要先定义什么是"创造力"。如果创造力仅仅是产出新颖内容，那么 AI 已经做到了。但如果我们认为创造力包含意图性和价值判断，那人类的角色仍然不可替代。', message_type: MessageType.ANSWER, sequence: 5, created_at: ago(12) },
]

const c1: ConsensusPoint[] = [
  { id: 'c1-1', discussion_id: d1.id, point_type: ConsensusType.CONSENSUS, content: 'AI 已展现出强大的内容生成能力', message_range_start: 1, message_range_end: 5, generated_at: ago(10) },
  { id: 'c1-2', discussion_id: d1.id, point_type: ConsensusType.DISAGREEMENT, content: '创造力的定义存在根本分歧 — 技术派认为产出即创造，人文派认为需包含意图性', message_range_start: 1, message_range_end: 5, generated_at: ago(10) },
]

// ── 讨论 2: PANEL_READY ───────────────────
const d2: Discussion = {
  id: 'd2-city-transport',
  topic: '2050 年的城市交通会是什么样？',
  expert_count: 4, status: DiscussionStatus.PANEL_READY,
  created_at: ago(120), updated_at: ago(60),
}

const p2: Panelist[] = [
  { id: 'd2-host', discussion_id: d2.id, name: '周雅文', role: PanelistRole.HOST, profession: '财经节目主持人', title: '资深主持人', stance: '中立主持', color: '#4ECDC4', status: PanelistStatus.STANDBY, current_focus: null, sort_order: 0 },
  { id: 'd2-e1', discussion_id: d2.id, name: '马丁', role: PanelistRole.EXPERT, profession: '城市规划师', title: '同济大学规划系主任', stance: '立体交通网络是必然趋势', color: colors4[0], status: PanelistStatus.STANDBY, current_focus: null, sort_order: 1 },
  { id: 'd2-e2', discussion_id: d2.id, name: '林雪', role: PanelistRole.EXPERT, profession: '自动驾驶工程师', title: 'Waymo 前技术负责人', stance: 'L5 自动驾驶将彻底改变出行', color: colors4[1], status: PanelistStatus.STANDBY, current_focus: null, sort_order: 2 },
  { id: 'd2-e3', discussion_id: d2.id, name: 'Green', role: PanelistRole.EXPERT, profession: '环保主义者', title: '绿色交通倡导者', stance: '零碳出行是底线而非选项', color: colors4[2], status: PanelistStatus.STANDBY, current_focus: null, sort_order: 3 },
  { id: 'd2-e4', discussion_id: d2.id, name: '钱伟', role: PanelistRole.EXPERT, profession: '经济学家', title: '社科院研究员', stance: '成本效益决定技术落地速度', color: colors4[3], status: PanelistStatus.STANDBY, current_focus: null, sort_order: 4 },
]

// ── 讨论 3: ENDED ─────────────────────────
const d3: Discussion = {
  id: 'd3-remote-work',
  topic: '远程办公是未来还是过渡方案？',
  expert_count: 6, status: DiscussionStatus.ENDED,
  created_at: ago(240), updated_at: ago(180),
}

const p3: Panelist[] = [
  { id: 'd3-host', discussion_id: d3.id, name: '孙涛', role: PanelistRole.HOST, profession: '商业评论员', title: '资深主持人', stance: '中立主持', color: '#4ECDC4', status: PanelistStatus.STANDBY, current_focus: null, sort_order: 0 },
  { id: 'd3-e1', discussion_id: d3.id, name: '吴芳', role: PanelistRole.EXPERT, profession: 'HR 总监', title: '某跨国公司 CHRO', stance: '混合办公是未来主流', color: colors6[0], status: PanelistStatus.STANDBY, current_focus: null, sort_order: 1 },
  { id: 'd3-e2', discussion_id: d3.id, name: '郑明', role: PanelistRole.EXPERT, profession: '组织心理学家', title: '中科院研究员', stance: '远程办公对心理健康影响被低估', color: colors6[1], status: PanelistStatus.STANDBY, current_focus: null, sort_order: 2 },
  { id: 'd3-e3', discussion_id: d3.id, name: '黄丽', role: PanelistRole.EXPERT, profession: '企业管理顾问', title: '麦肯锡前合伙人', stance: '数据驱动才能回答这个问题', color: colors6[2], status: PanelistStatus.STANDBY, current_focus: null, sort_order: 3 },
  { id: 'd3-e4', discussion_id: d3.id, name: 'Alex', role: PanelistRole.EXPERT, profession: '远程办公倡导者', title: 'Remote.com 创始人', stance: '办公室是 20 世纪的遗产', color: colors6[3], status: PanelistStatus.STANDBY, current_focus: null, sort_order: 4 },
  { id: 'd3-e5', discussion_id: d3.id, name: '沈工', role: PanelistRole.EXPERT, profession: '办公空间设计师', title: 'Gensler 设计总监', stance: '空间应随工作方式进化', color: colors6[4], status: PanelistStatus.STANDBY, current_focus: null, sort_order: 5 },
  { id: 'd3-e6', discussion_id: d3.id, name: '冯总', role: PanelistRole.EXPERT, profession: 'IT 基础设施专家', title: '某云厂商 VP', stance: '技术已成熟，文化才是障碍', color: colors6[5], status: PanelistStatus.STANDBY, current_focus: null, sort_order: 6 },
]

const m3: Message[] = [
  { id: 'm3-1', discussion_id: d3.id, panelist_id: 'd3-host', panelist_name: '孙涛', panelist_title: '资深主持人', panelist_color: '#4ECDC4', content: '疫情后远程办公从应急方案变成了常态选项。今天我们探讨它到底是未来还是过渡。', message_type: MessageType.OPENING, sequence: 1, created_at: ago(200) },
  { id: 'm3-2', discussion_id: d3.id, panelist_id: 'd3-e4', panelist_name: 'Alex', panelist_title: 'Remote.com 创始人', panelist_color: colors6[3], content: '数据很清楚——远程办公的员工生产力提升了 13%，离职率降低了 50%。办公室是工业时代的遗留物。', message_type: MessageType.ANSWER, sequence: 2, created_at: ago(195) },
  { id: 'm3-3', discussion_id: d3.id, panelist_id: 'd3-e2', panelist_name: '郑明', panelist_title: '中科院研究员', panelist_color: colors6[1], content: '生产力数据我认可，但我们的研究显示远程办公者的孤独感指数上升了 40%，这长期来看会影响创造力和团队凝聚力。', message_type: MessageType.SUPPLEMENT, sequence: 3, created_at: ago(190) },
  { id: 'm3-4', discussion_id: d3.id, panelist_id: 'd3-host', panelist_name: '孙涛', panelist_title: '资深主持人', panelist_color: '#4ECDC4', content: '感谢各位专家的精彩讨论。我们看到远程办公的优势和挑战都非常真实，未来的答案可能不是非此即彼，而是找到最适合各自组织文化的混合模式。', message_type: MessageType.SUMMARY, sequence: 4, created_at: ago(185) },
]

const c3: ConsensusPoint[] = [
  { id: 'c3-1', discussion_id: d3.id, point_type: ConsensusType.CONSENSUS, content: '远程办公提升了个人生产力', message_range_start: 1, message_range_end: 3, generated_at: ago(190) },
  { id: 'c3-2', discussion_id: d3.id, point_type: ConsensusType.DISAGREEMENT, content: '远程办公对团队凝聚力的长期影响存在分歧', message_range_start: 1, message_range_end: 3, generated_at: ago(190) },
]

// ── 讨论 4: PENDING_PANEL ──────────────────
const d4: Discussion = {
  id: 'd4-mars',
  topic: '我们应该殖民火星吗？',
  expert_count: 4, status: DiscussionStatus.PENDING_PANEL,
  created_at: ago(5), updated_at: ago(5),
}

// ── 讨论 5: PANEL_READY ────────────────────
const d5: Discussion = {
  id: 'd5-ubi',
  topic: '全民基本收入（UBI）可行吗？',
  expert_count: 5, status: DiscussionStatus.PANEL_READY,
  created_at: ago(90), updated_at: ago(45),
}

const p5: Panelist[] = [
  { id: 'd5-host', discussion_id: d5.id, name: '林涛', role: PanelistRole.HOST, profession: '政经评论员', title: '资深主持人', stance: '中立主持', color: '#4ECDC4', status: PanelistStatus.STANDBY, current_focus: null, sort_order: 0 },
  { id: 'd5-e1', discussion_id: d5.id, name: '许教授', role: PanelistRole.EXPERT, profession: '经济学家', title: '北大光华管理学院教授', stance: 'UBI 在财政上不可持续', color: colors5[0], status: PanelistStatus.STANDBY, current_focus: null, sort_order: 1 },
  { id: 'd5-e2', discussion_id: d5.id, name: '白博士', role: PanelistRole.EXPERT, profession: '社会学家', title: '社科院研究员', stance: 'UBI 是社会公平的必要工具', color: colors5[1], status: PanelistStatus.STANDBY, current_focus: null, sort_order: 2 },
  { id: 'd5-e3', discussion_id: d5.id, name: '韩部长', role: PanelistRole.EXPERT, profession: '政策制定者', title: '前劳动部官员', stance: '实施路径比理论更重要', color: colors5[2], status: PanelistStatus.STANDBY, current_focus: null, sort_order: 3 },
  { id: 'd5-e4', discussion_id: d5.id, name: '雷总', role: PanelistRole.EXPERT, profession: '科技企业家', title: '某 AI 公司创始人', stance: 'AI 时代 UBI 不可避免', color: colors5[3], status: PanelistStatus.STANDBY, current_focus: null, sort_order: 4 },
  { id: 'd5-e5', discussion_id: d5.id, name: '温代表', role: PanelistRole.EXPERT, profession: '劳工代表', title: '全国总工会顾问', stance: 'UBI 不能替代劳动保障', color: colors5[4], status: PanelistStatus.STANDBY, current_focus: null, sort_order: 5 },
]

// ── 导出 ─────────────────────────────────
export const mockDiscussions = [d1, d2, d3, d4, d5]
export const mockPanelists: Record<string, Panelist[]> = { [d1.id]: p1, [d2.id]: p2, [d3.id]: p3, [d5.id]: p5 }
export const mockMessages: Record<string, Message[]> = { [d1.id]: m1, [d3.id]: m3 }
export const mockConsensus: Record<string, ConsensusPoint[]> = { [d1.id]: c1, [d3.id]: c3 }
