import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.dependencies import CurrentUser, get_current_user, require_tpc_admin
from app.db.supabase import get_supabase_client
from app.utils.response import success


router = APIRouter(tags=["students"])


def _ensure_admin_or_owner(current_user: CurrentUser, student_id: str) -> None:
    if current_user["role"] == "tpc_admin":
        return

    if current_user["role"] == "student" and current_user["id"] == student_id:
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Students can only access their own profile",
    )


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

    student_ids = [str(row["id"]) for row in rows if row.get("id") is not None]
    if not student_ids:
        return success([], "Students fetched")

    score_rows = (
        client.table("vigilo_scores")
        .select(
            "student_id, score, cluster, placement_probability, computed_at, score_breakdown"
        )
        .eq("is_latest", True)
        .in_("student_id", student_ids)
        .execute()
        .data
        or []
    )
    score_map = {str(row["student_id"]): row for row in score_rows if row.get("student_id") is not None}

    student_profile_rows = (
        client.table("student_profiles")
        .select(
            "id, mock_tests_attempted, last_portal_login, placement_status, "
            "active_backlogs, internship_count, cgpa"
        )
        .in_("id", student_ids)
        .execute()
        .data
        or []
    )
    student_profile_map = {
        str(row["id"]): row for row in student_profile_rows if row.get("id") is not None
    }

    unresolved_alert_rows = (
        client.table("alerts")
        .select("student_id")
        .in_("student_id", student_ids)
        .eq("is_resolved", False)
        .execute()
        .data
        or []
    )
    unresolved_alert_count_by_student: dict[str, int] = {}
    for row in unresolved_alert_rows:
        student_id = row.get("student_id")
        if student_id is None:
            continue
        key = str(student_id)
        unresolved_alert_count_by_student[key] = unresolved_alert_count_by_student.get(key, 0) + 1

    enriched_rows: list[dict[str, Any]] = []
    for row in rows:
        student_id = str(row["id"])
        latest_score = score_map.get(student_id)
        student_profile = student_profile_map.get(student_id, {})

        raw_probability = (
            float(latest_score.get("placement_probability") or 0.0)
            if latest_score is not None
            else None
        )

        enriched_rows.append(
            {
                **row,
                "risk_score": float(latest_score.get("score") or 0.0)
                if latest_score is not None
                else None,
                "cluster": str(latest_score.get("cluster")) if latest_score else None,
                "placement_probability": round((raw_probability or 0.0) * 100.0, 2)
                if raw_probability is not None
                else None,
                "placement_probability_raw": raw_probability,
                "score_computed_at": latest_score.get("computed_at") if latest_score else None,
                "score_breakdown": latest_score.get("score_breakdown") if latest_score else None,
                "mock_tests_attempted": int(student_profile.get("mock_tests_attempted") or 0),
                "last_portal_login": student_profile.get("last_portal_login"),
                "placement_status": student_profile.get("placement_status"),
                "active_backlogs": int(student_profile.get("active_backlogs") or 0),
                "internship_count": int(student_profile.get("internship_count") or 0),
                "cgpa": float(student_profile.get("cgpa") or 0.0)
                if student_profile.get("cgpa") is not None
                else None,
                "open_alert_count": unresolved_alert_count_by_student.get(student_id, 0),
            }
        )

    return success(enriched_rows, "Students fetched")


@router.get("/{student_id}")
def get_student_profile(
    student_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
) -> dict[str, Any]:
    student_id_str = str(student_id)
    _ensure_admin_or_owner(current_user, student_id_str)

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


@router.get("/{student_id}/activity")
def get_student_activity(
    student_id: uuid.UUID,
    limit: int = 10,
    current_user: CurrentUser = Depends(get_current_user),
) -> dict[str, Any]:
    student_id_str = str(student_id)
    _ensure_admin_or_owner(current_user, student_id_str)

    normalized_limit = max(1, min(limit, 100))
    client = get_supabase_client()
    rows = (
        client.table("activity_logs")
        .select("*")
        .eq("student_id", student_id_str)
        .order("logged_at", desc=True)
        .range(0, normalized_limit - 1)
        .execute()
        .data
        or []
    )

    return success(rows, "Student activity fetched")
