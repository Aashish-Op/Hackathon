from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


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


SkillProficiency = Literal["beginner", "intermediate", "advanced"]


class StudentProfileUpdate(BaseModel):
    cgpa: float | None = None
    active_backlogs: int | None = None
    certifications_count: int | None = None

    @field_validator("cgpa")
    @classmethod
    def validate_cgpa(cls, value: float | None) -> float | None:
        if value is None:
            return None
        if not 0.0 <= value <= 10.0:
            raise ValueError("cgpa must be between 0.0 and 10.0")
        return value

    @field_validator("active_backlogs")
    @classmethod
    def validate_active_backlogs(cls, value: int | None) -> int | None:
        if value is None:
            return None
        if value < 0:
            raise ValueError("active_backlogs must be >= 0")
        return value

    @field_validator("certifications_count")
    @classmethod
    def validate_certifications_count(cls, value: int | None) -> int | None:
        if value is None:
            return None
        if value < 0:
            raise ValueError("certifications_count must be >= 0")
        return value


class SkillCreate(BaseModel):
    skill_name: str = Field(min_length=2, max_length=50)
    proficiency: SkillProficiency

    @field_validator("skill_name", mode="before")
    @classmethod
    def normalize_skill_name(cls, value: str) -> str:
        if isinstance(value, str):
            return value.strip()
        return value
