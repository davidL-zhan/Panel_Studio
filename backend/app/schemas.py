"""SDD §02-api-contract — 全部 Pydantic 请求/响应 Schema"""
from pydantic import BaseModel, Field
from datetime import datetime


# ═══ 枚举字面量 ═══════════════════════════════════

DStatus = str  # PENDING_PANEL | PANEL_READY | IN_PROGRESS | ENDED
PRole   = str  # HOST | EXPERT
PStatus = str  # STANDBY | PREPARING | SPEAKING
MType   = str  # OPENING | QUESTION | ANSWER | SUPPLEMENT | REBUTTAL | TRANSITION | SUMMARY
CType   = str  # CONSENSUS | DISAGREEMENT


# ═══ Discussion ═══════════════════════════════════

class DiscussionOut(BaseModel):
    id: str
    topic: str
    expert_count: int
    status: DStatus
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


class CreateDiscussionIn(BaseModel):
    topic: str = Field(min_length=1, max_length=200)
    expert_count: int = Field(default=4, ge=4, le=8)


# ═══ Panelist ════════════════════════════════════

class PanelistOut(BaseModel):
    id: str
    discussion_id: str
    name: str
    role: PRole
    profession: str
    title: str
    stance: str
    color: str
    status: PStatus
    current_focus: str | None = None
    sort_order: int
    model_config = {"from_attributes": True}


class PanelStatusUpdate(BaseModel):
    id: str
    status: PStatus
    current_focus: str | None = None


# ═══ Message ═════════════════════════════════════

class MessageOut(BaseModel):
    id: str
    discussion_id: str
    panelist_id: str
    panelist_name: str
    panelist_title: str
    panelist_color: str
    content: str
    message_type: MType
    sequence: int
    created_at: datetime
    model_config = {"from_attributes": True}


# ═══ ConsensusPoint ═════════════════════════════

class ConsensusPointOut(BaseModel):
    id: str
    discussion_id: str
    point_type: CType
    content: str
    message_range_start: int | None = None
    message_range_end: int | None = None
    generated_at: datetime
    model_config = {"from_attributes": True}


# ═══ 复合响应 ═══════════════════════════════════

class DiscussionDetailOut(DiscussionOut):
    panelists: list[PanelistOut] = []
    latest_messages: list[MessageOut] = []
    consensus_points: list[ConsensusPointOut] = []


class PanelGenerateOut(BaseModel):
    host: PanelistOut
    experts: list[PanelistOut]


class TranscriptOut(BaseModel):
    total: int
    messages: list[MessageOut]


class StartOut(BaseModel):
    status: DStatus
    message: str


class EndOut(BaseModel):
    status: DStatus
    summary: str
