import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.dependencies import CurrentUser, get_current_user, require_tpc_admin
from app.db.supabase import get_supabase_client
from app.utils.response import success


router = APIRouter(tags=["students"])


@router.get("/me")
def get_my_profile(current_user: CurrentUser = Depends(get_current_user)) -> dict[str, Any]:
    client = get_supabase_client()

    profile_rows = (
        client.table("profiles")
        .select("*")
        .eq("id", current_user["id"])
        .limit(1)
        .execute()
        .data
        or []
    )
    student_rows = (
        client.table("student_profiles")
        .select("*")
        .eq("id", current_user["id"])
        .limit(1)
        .execute()
        .data
        or []
    )

    if not profile_rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found",
        )

    profile = profile_rows[0]

    if current_user["role"] == "tpc_admin":
        return success(profile, "Profile fetched")

    return success(
        {
            "profile": profile,
            "student_profile": student_rows[0] if student_rows else None,
        },
        "Student profile fetched",
    )


@router.get("/")
def list_students(
    limit: int = 50,
    offset: int = 0,
    _: CurrentUser = Depends(require_tpc_admin),
) -> dict[str, Any]:
    client = get_supabase_client()

    normalized_limit = max(1, min(limit, 200))
    normalized_offset = max(0, offset)

    rows = (
        client.table("profiles")
        .select("id, full_name, email, department, batch_year")
        .eq("role", "student")
        .range(normalized_offset, normalized_offset + normalized_limit - 1)
        .execute()
        .data
        or []
    )

    return success(rows, "Students fetched")


@router.get("/{student_id}")
def get_student_profile(
    student_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
) -> dict[str, Any]:
    student_id_str = str(student_id)

    if current_user["role"] == "student" and current_user["id"] != student_id_str:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Students can only access their own profile",
        )

    client = get_supabase_client()
    profile_rows = client.table("profiles").select("*").eq("id", student_id_str).limit(1).execute().data or []
    student_rows = (
        client.table("student_profiles").select("*").eq("id", student_id_str).limit(1).execute().data or []
    )

    if not profile_rows:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    return success(
        {
            "profile": profile_rows[0],
            "student_profile": student_rows[0] if student_rows else None,
        },
        "Student profile fetched",
    )
