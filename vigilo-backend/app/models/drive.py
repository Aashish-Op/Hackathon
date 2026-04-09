from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


DriveStatus = Literal["upcoming", "ongoing", "completed"]
ApplicationStatus = Literal["applied", "shortlisted", "rejected", "selected"]


class PlacementDriveCreate(BaseModel):
    company_name: str
    role: str
    package_lpa: float | None = Field(default=None, ge=0.0)
    drive_date: date
    eligibility_criteria: dict[str, str | int | float | bool | list[str] | None]
    status: DriveStatus


class PlacementDriveRead(PlacementDriveCreate):
    id: UUID
    created_at: datetime


class DriveApplicationCreate(BaseModel):
    drive_id: UUID


class DriveApplicationRead(BaseModel):
    id: UUID
    drive_id: UUID
    student_id: UUID
    status: ApplicationStatus
    applied_at: datetime
