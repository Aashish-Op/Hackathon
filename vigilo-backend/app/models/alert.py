from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel


AlertType = Literal["silent_30", "score_drop", "cluster_change", "no_resume", "zero_mocks"]
AlertSeverity = Literal["low", "medium", "high", "critical"]


class AlertRead(BaseModel):
    id: UUID
    student_id: UUID
    alert_type: AlertType
    severity: AlertSeverity
    message: str
    is_read: bool
    is_resolved: bool
    triggered_at: datetime
    resolved_at: datetime | None = None
    resolved_by: UUID | None = None


class ResolveAlertRequest(BaseModel):
    is_resolved: bool = True
    is_read: bool = True
