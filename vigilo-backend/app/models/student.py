from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


UserRole = Literal["tpc_admin", "student"]
PlacementStatus = Literal["unplaced", "process", "placed"]


class Profile(BaseModel):
    id: UUID
    full_name: str
    email: str
    role: UserRole
    department: str | None = None
    batch_year: int | None = Field(default=None, ge=2000, le=2100)
    avatar_url: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class StudentProfile(BaseModel):
    id: UUID
    cgpa: float | None = Field(default=None, ge=0.0, le=10.0)
    active_backlogs: int = Field(default=0, ge=0)
    internship_count: int = Field(default=0, ge=0)
    github_url: str | None = None
    linkedin_url: str | None = None
    resume_updated_at: datetime | None = None
    last_portal_login: datetime | None = None
    mock_tests_attempted: int = Field(default=0, ge=0)
    mock_avg_score: float | None = Field(default=None, ge=0.0, le=100.0)
    certifications_count: int = Field(default=0, ge=0)
    placement_status: PlacementStatus = "unplaced"
    company_placed: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class StudentDetail(BaseModel):
    profile: Profile
    student_profile: StudentProfile | None = None


class StudentSummary(BaseModel):
    id: UUID
    full_name: str
    department: str | None = None
    batch_year: int | None = None
    placement_status: PlacementStatus = "unplaced"
