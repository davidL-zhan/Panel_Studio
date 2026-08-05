"""SDD §03-database-schema — SQLAlchemy 模型 + 异步引擎"""
import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy import (
    Column, String, Integer, Text, DateTime, ForeignKey,
    CheckConstraint, UniqueConstraint, event,
)
from sqlalchemy.orm import DeclarativeBase, relationship
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from .config import settings


class Base(DeclarativeBase):
    pass


def gen_uuid() -> str:
    return str(uuid.uuid4())


BEIJING_TZ = timezone(timedelta(hours=8))

def utcnow() -> datetime:
    return datetime.now(BEIJING_TZ)


# ═══ ORM Models ═══════════════════════════════════════


class Discussion(Base):
    __tablename__ = "discussion"

    id           = Column(String, primary_key=True, default=gen_uuid)
    topic        = Column(String, nullable=False)
    expert_count = Column(Integer, nullable=False, default=4)
    status       = Column(String, nullable=False, default="PENDING_PANEL")
    created_at   = Column(DateTime, nullable=False, default=utcnow)
    updated_at   = Column(DateTime, nullable=False, default=utcnow, onupdate=utcnow)

    __table_args__ = (
        CheckConstraint("expert_count >= 4 AND expert_count <= 8"),
        CheckConstraint("status IN ('PENDING_PANEL','PANEL_READY','IN_PROGRESS','ENDED')"),
    )

    panelists        = relationship("Panelist", back_populates="discussion", cascade="all, delete-orphan")
    messages         = relationship("Message", back_populates="discussion", cascade="all, delete-orphan")
    consensus_points = relationship("ConsensusPoint", back_populates="discussion", cascade="all, delete-orphan")


class Panelist(Base):
    __tablename__ = "panelist"

    id            = Column(String, primary_key=True, default=gen_uuid)
    discussion_id = Column(String, ForeignKey("discussion.id", ondelete="CASCADE"), nullable=False)
    name          = Column(String, nullable=False)
    role          = Column(String, nullable=False)
    profession    = Column(String, nullable=False)
    title         = Column(String, nullable=False)
    stance        = Column(String, nullable=False)
    color         = Column(String, nullable=False)
    status        = Column(String, nullable=False, default="STANDBY")
    current_focus = Column(String, nullable=True)
    sort_order    = Column(Integer, nullable=False, default=0)

    __table_args__ = (
        CheckConstraint("role IN ('HOST','EXPERT')"),
        CheckConstraint("status IN ('STANDBY','PREPARING','SPEAKING')"),
    )

    discussion = relationship("Discussion", back_populates="panelists")
    messages   = relationship("Message", back_populates="panelist")


class Message(Base):
    __tablename__ = "message"

    id            = Column(String, primary_key=True, default=gen_uuid)
    discussion_id = Column(String, ForeignKey("discussion.id", ondelete="CASCADE"), nullable=False)
    panelist_id   = Column(String, ForeignKey("panelist.id", ondelete="CASCADE"), nullable=False)
    content       = Column(Text, nullable=False)
    message_type  = Column(String, nullable=False)
    sequence      = Column(Integer, nullable=False)
    created_at    = Column(DateTime, nullable=False, default=utcnow)

    __table_args__ = (
        CheckConstraint("message_type IN ('OPENING','QUESTION','ANSWER','SUPPLEMENT','REBUTTAL','TRANSITION','SUMMARY')"),
        UniqueConstraint("discussion_id", "sequence"),
    )

    discussion = relationship("Discussion", back_populates="messages")
    panelist   = relationship("Panelist", back_populates="messages")


class ConsensusPoint(Base):
    __tablename__ = "consensus_point"

    id                  = Column(String, primary_key=True, default=gen_uuid)
    discussion_id       = Column(String, ForeignKey("discussion.id", ondelete="CASCADE"), nullable=False)
    point_type          = Column(String, nullable=False)
    content             = Column(Text, nullable=False)
    message_range_start = Column(Integer, nullable=True)
    message_range_end   = Column(Integer, nullable=True)
    generated_at        = Column(DateTime, nullable=False, default=utcnow)

    __table_args__ = (
        CheckConstraint("point_type IN ('CONSENSUS','DISAGREEMENT')"),
    )

    discussion = relationship("Discussion", back_populates="consensus_points")


# ═══ 异步引擎 ═══════════════════════════════════════

engine = create_async_engine(settings.database_url, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


# WAL 模式 (SDD §03-database-schema §4.1)
@event.listens_for(engine.sync_engine, "connect")
def set_sqlite_pragma(dbapi_connection, _):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA busy_timeout=5000")
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
