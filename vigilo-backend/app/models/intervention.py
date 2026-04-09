from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


InterventionType = Literal[
    "nudge_sent",
    "meeting_scheduled",
    "domain_shift_suggested",
    "mock_assigned",
    "counselling",
    "weekly_check_in",
    "weekly_recommendation",
]
InterventionStatus = Literal["pending", "sent", "acknowledged", "completed"]


class InterventionCreate(BaseModel):
    student_id: UUID
    intervention_type: InterventionType
    ai_generated_message: str | None = None
    custom_message: str | None = None
    notes: str | None = None


class InterventionUpdate(BaseModel):
    status: InterventionStatus | None = None
    sent_at: datetime | None = None
    acknowledged_at: datetime | None = None
    notes: str | None = None


class InterventionRead(BaseModel):
    id: UUID
    student_id: UUID
    created_by: UUID
    intervention_type: InterventionType
    ai_generated_message: str | None = None
    custom_message: str | None = None
    status: InterventionStatus
    sent_at: datetime | None = None
    acknowledged_at: datetime | None = None
    notes: str | None = None
    created_at: datetime
    updated_at: datetime


class NudgeRequest(BaseModel):
    student_id: UUID
    context: dict[str, str | int | float | bool | None] = Field(default_factory=dict)
    suggested_actions: list[str] = Field(default_factory=list)
    custom_message: str | None = None
