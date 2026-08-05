// SDD §01-domain-model — 枚举定义
// DDD 源头：04-page-state-matrix.md

export enum DiscussionStatus {
  PENDING_PANEL = 'PENDING_PANEL',
  PANEL_READY = 'PANEL_READY',
  IN_PROGRESS = 'IN_PROGRESS',
  ENDED = 'ENDED',
}

export enum PanelistRole {
  HOST = 'HOST',
  EXPERT = 'EXPERT',
}

export enum PanelistStatus {
  STANDBY = 'STANDBY',
  PREPARING = 'PREPARING',
  SPEAKING = 'SPEAKING',
}

export enum MessageType {
  OPENING = 'OPENING',
  QUESTION = 'QUESTION',
  ANSWER = 'ANSWER',
  SUPPLEMENT = 'SUPPLEMENT',
  REBUTTAL = 'REBUTTAL',
  TRANSITION = 'TRANSITION',
  SUMMARY = 'SUMMARY',
}

export enum ConsensusType {
  CONSENSUS = 'CONSENSUS',
  DISAGREEMENT = 'DISAGREEMENT',
}

// WebSocket 连接状态（DDD §04-page-state-matrix §4.2）
export enum WsConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
}
