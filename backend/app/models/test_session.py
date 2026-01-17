from sqlalchemy import Column, Integer, String, DateTime, JSON, Enum
from sqlalchemy.sql import func
from app.database import Base
import enum


class Level(str, enum.Enum):
    BEGINNER = "beginner"
    ELEMENTARY = "elementary"
    INTERMEDIATE = "intermediate"
    UPPER_INTERMEDIATE = "upper_intermediate"
    ADVANCED = "advanced"


class Phase(str, enum.Enum):
    LISTENING_SPEAKING = "listening_speaking"
    READING_WRITING = "reading_writing"


class SessionStatus(str, enum.Enum):
    INITIALIZED = "initialized"
    PHASE1_SELECTED = "phase1_selected"
    PHASE1_GENERATED = "phase1_generated"
    PHASE1_IN_PROGRESS = "phase1_in_progress"
    PHASE1_COMPLETED = "phase1_completed"
    PHASE2_GENERATED = "phase2_generated"
    PHASE2_IN_PROGRESS = "phase2_in_progress"
    PHASE2_COMPLETED = "phase2_completed"
    COMPLETED = "completed"


class TestSession(Base):
    __tablename__ = "test_sessions"

    id = Column(Integer, primary_key=True, index=True)
    level = Column(Enum(Level), nullable=False)
    selected_phase = Column(Enum(Phase), nullable=True)
    status = Column(Enum(SessionStatus), default=SessionStatus.INITIALIZED)

    # Phase 1 data
    phase1_content = Column(JSON, nullable=True)  # Generated questions/content
    phase1_answers = Column(JSON, nullable=True)  # User answers
    phase1_scores = Column(JSON, nullable=True)  # Scoring results

    # Phase 2 data
    phase2_content = Column(JSON, nullable=True)
    phase2_answers = Column(JSON, nullable=True)
    phase2_scores = Column(JSON, nullable=True)

    # Final results
    final_results = Column(JSON, nullable=True)  # Aggregated IELTS scores

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    phase1_started_at = Column(DateTime(timezone=True), nullable=True)
    phase1_completed_at = Column(DateTime(timezone=True), nullable=True)
    phase2_started_at = Column(DateTime(timezone=True), nullable=True)
    phase2_completed_at = Column(DateTime(timezone=True), nullable=True)
