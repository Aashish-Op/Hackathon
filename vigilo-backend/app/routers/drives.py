from datetime import date, datetime, timezone
import uuid
from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.auth.dependencies import CurrentUser, get_current_user, require_student, require_tpc_admin
from app.db.supabase import get_supabase_client
from app.models.drive import PlacementDriveCreate
from app.utils.response import success


DriveStatus = Literal["upcoming", "ongoing", "completed"]
ApplicationStatus = Literal["applied", "shortlisted", "rejected", "selected"]


class PlacementDriveUpdate(BaseModel):
    company_name: str | None = None
    role: str | None = None
    package_lpa: float | None = Field(default=None, ge=0.0)
    drive_date: date | None = None
    eligibility_criteria: dict[str, Any] | None = None
    status: DriveStatus | None = None


class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus


router = APIRouter(tags=["drives"])


def _get_drive_or_404(drive_id: uuid.UUID | str) -> dict[str, Any]:
    drive_id_str = str(drive_id)
    client = get_supabase_client()
    rows = client.table("placement_drives").select("*").eq("id", drive_id_str).limit(1).execute().data or []
    if not rows:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Drive not found")
    return rows[0]


def _is_student_eligible(drive: dict[str, Any], student_cgpa: float, student_department: str | None) -> bool:
    criteria = drive.get("eligibility_criteria")
    if not isinstance(criteria, dict):
        return True

    min_cgpa = float(criteria.get("min_cgpa") or 0.0)
    allowed_branches = criteria.get("allowed_branches") or criteria.get("departments") or []

    if isinstance(allowed_branches, str):
        allowed = [allowed_branches]
    elif isinstance(allowed_branches, list):
        allowed = [str(item) for item in allowed_branches]
    else:
        allowed = []

    branch_ok = True
    if allowed:
        normalized_student_department = (student_department or "").strip().lower()
        normalized_allowed = {branch.strip().lower() for branch in allowed}
        branch_ok = normalized_student_department in normalized_allowed

    return student_cgpa >= min_cgpa and branch_ok


@router.get("")
def list_drives(
    status_filter: DriveStatus | None = Query(default=None, alias="status"),
    from_date: date | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=200),
    current_user: CurrentUser = Depends(get_current_user),
) -> dict[str, Any]:
    client = get_supabase_client()
    query = client.table("placement_drives").select("*").order("drive_date")

    if status_filter is not None:
        query = query.eq("status", status_filter)
    if from_date is not None:
        query = query.gte("drive_date", from_date.isoformat())

    if current_user["role"] == "tpc_admin":
        start = (page - 1) * limit
        end = start + limit - 1
        rows = query.range(start, end).execute().data or []
        return success(
            {
                "page": page,
                "limit": limit,
                "count": len(rows),
                "items": rows,
            },
            "Drives fetched",
        )

    profile_rows = (
        client.table("profiles")
        .select("department")
        .eq("id", current_user["id"])
        .limit(1)
        .execute()
        .data
        or []
    )
    student_rows = (
        client.table("student_profiles")
        .select("cgpa")
        .eq("id", current_user["id"])
        .limit(1)
        .execute()
        .data
        or []
    )

    student_department = profile_rows[0].get("department") if profile_rows else None
    student_cgpa = float(student_rows[0].get("cgpa") or 0.0) if student_rows else 0.0

    all_rows = query.execute().data or []
    eligible = [
        drive
        for drive in all_rows
        if _is_student_eligible(drive, student_cgpa=student_cgpa, student_department=student_department)
    ]

    start = (page - 1) * limit
    end = start + limit
    paged = eligible[start:end]

    return success(
        {
            "page": page,
            "limit": limit,
            "count": len(paged),
            "items": paged,
        },
        "Eligible drives fetched",
    )


@router.get("/{drive_id}")
def get_drive_details(
    drive_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
) -> dict[str, Any]:
    drive_id_str = str(drive_id)
    client = get_supabase_client()
    drive = _get_drive_or_404(drive_id_str)

    application_rows = (
        client.table("drive_applications")
        .select("*")
        .eq("drive_id", drive_id_str)
        .order("applied_at", desc=True)
        .execute()
        .data
        or []
    )

    payload: dict[str, Any] = {
        "drive": drive,
        "applicant_count": len(application_rows),
    }

    if current_user["role"] == "tpc_admin":
        applicant_ids = list({str(row["student_id"]) for row in application_rows})
        profile_map: dict[str, dict[str, Any]] = {}
        if applicant_ids:
            profile_rows = (
                client.table("profiles")
                .select("id, full_name, department")
                .in_("id", applicant_ids)
                .execute()
                .data
                or []
            )
            profile_map = {str(row["id"]): row for row in profile_rows}

        applicants = []
        for row in application_rows:
            profile = profile_map.get(str(row["student_id"]), {})
            applicants.append(
                {
                    **row,
                    "student_name": profile.get("full_name"),
                    "student_department": profile.get("department"),
                }
            )

        payload["applicants"] = applicants
    else:
        own_application = next(
            (row for row in application_rows if str(row.get("student_id")) == current_user["id"]),
            None,
        )
        payload["my_application_status"] = own_application.get("status") if own_application else None

    return success(payload, "Drive details fetched")


@router.post("")
def create_drive(
    payload: PlacementDriveCreate,
    _: CurrentUser = Depends(require_tpc_admin),
) -> dict[str, Any]:
    client = get_supabase_client()
    insert_payload = payload.model_dump(mode="json")
    rows = client.table("placement_drives").insert(insert_payload).execute().data or []
    return success(rows[0] if rows else insert_payload, "Drive created")


@router.patch("/{drive_id}")
def update_drive(
    drive_id: uuid.UUID,
    payload: PlacementDriveUpdate,
    _: CurrentUser = Depends(require_tpc_admin),
) -> dict[str, Any]:
    drive_id_str = str(drive_id)
    _get_drive_or_404(drive_id_str)

    update_payload = payload.model_dump(exclude_none=True, mode="json")
    if not update_payload:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No update fields provided")

    client = get_supabase_client()
    rows = client.table("placement_drives").update(update_payload).eq("id", drive_id_str).execute().data or []
    return success(rows[0] if rows else update_payload, "Drive updated")


@router.post("/{drive_id}/apply")
def apply_to_drive(
    drive_id: uuid.UUID,
    current_user: CurrentUser = Depends(require_student),
) -> dict[str, Any]:
    drive_id_str = str(drive_id)
    client = get_supabase_client()
    drive = _get_drive_or_404(drive_id_str)

    profile_rows = (
        client.table("profiles")
        .select("department")
        .eq("id", current_user["id"])
        .limit(1)
        .execute()
        .data
        or []
    )
    student_rows = (
        client.table("student_profiles")
        .select("cgpa")
        .eq("id", current_user["id"])
        .limit(1)
        .execute()
        .data
        or []
    )

    student_department = profile_rows[0].get("department") if profile_rows else None
    student_cgpa = float(student_rows[0].get("cgpa") or 0.0) if student_rows else 0.0
    if not _is_student_eligible(drive, student_cgpa=student_cgpa, student_department=student_department):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not eligible for this drive",
        )

    existing = (
        client.table("drive_applications")
        .select("id")
        .eq("drive_id", drive_id_str)
        .eq("student_id", current_user["id"])
        .limit(1)
        .execute()
        .data
        or []
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already applied")

    applied_at = datetime.now(timezone.utc).isoformat()
    insert_payload = {
        "drive_id": drive_id_str,
        "student_id": current_user["id"],
        "status": "applied",
        "applied_at": applied_at,
    }
    rows = client.table("drive_applications").insert(insert_payload).execute().data or []

    activity_payload = {
        "student_id": current_user["id"],
        "activity_type": "job_applied",
        "metadata": {
            "drive_id": drive_id_str,
            "applied_at": applied_at,
        },
    }
    client.table("activity_logs").insert(activity_payload).execute()

    return success(rows[0] if rows else insert_payload, "Application submitted")


@router.patch("/{drive_id}/applications/{student_id}")
def update_application_status(
    drive_id: uuid.UUID,
    student_id: uuid.UUID,
    payload: ApplicationStatusUpdate,
    _: CurrentUser = Depends(require_tpc_admin),
) -> dict[str, Any]:
    drive_id_str = str(drive_id)
    student_id_str = str(student_id)
    client = get_supabase_client()
    _get_drive_or_404(drive_id_str)

    existing = (
        client.table("drive_applications")
        .select("id")
        .eq("drive_id", drive_id_str)
        .eq("student_id", student_id_str)
        .limit(1)
        .execute()
        .data
        or []
    )
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    rows = (
        client.table("drive_applications")
        .update({"status": payload.status})
        .eq("drive_id", drive_id_str)
        .eq("student_id", student_id_str)
        .execute()
        .data
        or []
    )

    if payload.status == "selected":
        drive = _get_drive_or_404(drive_id_str)
        company_name = drive.get("company_name")
        client.table("student_profiles").update(
            {
                "placement_status": "placed",
                "company_placed": company_name,
            }
        ).eq("id", student_id_str).execute()

    return success(rows[0] if rows else {"status": payload.status}, "Application status updated")
