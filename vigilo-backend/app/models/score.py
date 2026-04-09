from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


ClusterLabel = Literal["placement_ready", "at_risk", "silent_dropout"]


class VigiloScoreCreate(BaseModel):
    student_id: UUID
    score: float = Field(ge=0.0, le=100.0)
    cluster: ClusterLabel
    placement_probability: float = Field(ge=0.0, le=1.0)
    score_breakdown: dict[str, float]
    is_latest: bool = True


class VigiloScoreRead(VigiloScoreCreate):
    id: UUID
    computed_at: datetime


class RecomputeRequest(BaseModel):
    student_id: UUID | None = None


class RecomputeResult(BaseModel):
    student_id: UUID
    score: float
    cluster: ClusterLabel
    placement_probability: float
    computed_at: datetime
