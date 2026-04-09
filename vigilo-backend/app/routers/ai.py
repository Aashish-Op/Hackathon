import time
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.auth.dependencies import CurrentUser, get_current_user, require_tpc_admin
from app.db.supabase import get_supabase_client
from app.services.alert_engine import run_alert_check
from app.services.cluster_engine import run_batch_clustering
from app.services.nudge_engine import generate_bulk_nudges, generate_nudge
from app.services.risk_engine import compute_score
from app.utils.response import success


PROFICIENCY_TO_LEVEL: dict[str, float] = {
    "beginner": 1.0,
    "intermediate": 2.0,
    "advanced": 3.0,
}
VALID_INTERVENTION_TYPES: set[str] = {
    "nudge_sent",
    "meeting_scheduled",
    "domain_shift_suggested",
    "mock_assigned",
    "counselling",
    "weekly_check_in",
    "weekly_recommendation",
}


class NudgeRequest(BaseModel):
    intervention_type: str


class BulkNudgeRequest(BaseModel):
    student_ids: list[str] = Field(min_length=1)
    intervention_type: str


router = APIRouter(tags=["ai"])


def _normalize_intervention_type(intervention_type: str) -> tuple[str, str | None]:
    value = intervention_type.strip()
    if value in VALID_INTERVENTION_TYPES:
        return value, None

    return "nudge_sent", f"Requested type: {intervention_type}"


def _level_to_label(level: float) -> str:
    if level >= 2.5:
        return "advanced"
    if level >= 1.5:
        return "intermediate"
    return "beginner"


def _safe_intervention_insert(
    student_id: str,
    created_by: str,
    intervention_type: str,
    ai_message: str,
    status_value: str = "pending",
) -> dict[str, Any]:
    client = get_supabase_client()
    normalized_type, note = _normalize_intervention_type(intervention_type)
    payload: dict[str, Any] = {
        "student_id": student_id,
        "created_by": created_by,
        "intervention_type": normalized_type,
        "ai_generated_message": ai_message,
        "status": status_value,
    }
    if note is not None:
        payload["notes"] = note

    try:
        inserted = client.table("interventions").insert(payload).execute().data or []
        return inserted[0] if inserted else payload
    except Exception as exc:
        print(
            f"[ai_router] intervention insert failed for type={intervention_type}, "
            f"student_id={student_id}: {exc}"
        )
        fallback_payload = {
            **payload,
            "intervention_type": "nudge_sent",
            "notes": f"Requested type: {intervention_type}",
        }
        fallback_inserted = client.table("interventions").insert(fallback_payload).execute().data or []
        return fallback_inserted[0] if fallback_inserted else fallback_payload


def _ensure_admin_or_owner(current_user: CurrentUser, student_id: str) -> None:
    if current_user["role"] == "tpc_admin":
        return
    if current_user["role"] == "student" and current_user["id"] == student_id:
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Access denied for this student",
    )


def _get_skill_gaps(student_id: str) -> list[dict[str, Any]]:
    client = get_supabase_client()

    profile_rows = (
        client.table("profiles")
        .select("department")
        .eq("id", student_id)
        .limit(1)
        .execute()
        .data
        or []
    )
    if not profile_rows:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student profile not found")

    department = profile_rows[0].get("department")

    department_student_rows = (
        client.table("profiles")
        .select("id")
        .eq("role", "student")
        .eq("department", department)
        .execute()
        .data
        or []
    )
    department_student_ids = [str(row["id"]) for row in department_student_rows]

    if not department_student_ids:
        return []

    placed_rows = (
        client.table("student_profiles")
        .select("id")
        .in_("id", department_student_ids)
        .eq("placement_status", "placed")
        .execute()
        .data
        or []
    )
    placed_ids = [str(row["id"]) for row in placed_rows]
    if not placed_ids:
        return []

    peer_skill_rows = (
        client.table("student_skills")
        .select("student_id, skill_name, proficiency")
        .in_("student_id", placed_ids)
        .execute()
        .data
        or []
    )
    student_skill_rows = (
        client.table("student_skills")
        .select("skill_name, proficiency")
        .eq("student_id", student_id)
        .execute()
        .data
        or []
    )

    student_skill_levels: dict[str, float] = {}
    for row in student_skill_rows:
        skill_name = str(row.get("skill_name") or "").strip()
        if not skill_name:
            continue
        level = PROFICIENCY_TO_LEVEL.get(str(row.get("proficiency") or "").lower(), 0.0)
        student_skill_levels[skill_name] = max(student_skill_levels.get(skill_name, 0.0), level)

    peer_totals: dict[str, float] = {}
    peer_counts: dict[str, int] = {}
    for row in peer_skill_rows:
        skill_name = str(row.get("skill_name") or "").strip()
        if not skill_name:
            continue
        level = PROFICIENCY_TO_LEVEL.get(str(row.get("proficiency") or "").lower(), 0.0)
        peer_totals[skill_name] = peer_totals.get(skill_name, 0.0) + level
        peer_counts[skill_name] = peer_counts.get(skill_name, 0) + 1

    gaps: list[dict[str, Any]] = []
    for skill_name, total in peer_totals.items():
        count = peer_counts.get(skill_name, 0)
        if count <= 0:
            continue

        peer_avg = total / count
        student_level = student_skill_levels.get(skill_name, 0.0)
        gap = round(peer_avg - student_level, 2)
        if gap <= 0:
            continue

        gaps.append(
            {
                "skill_name": skill_name,
                "student_proficiency": _level_to_label(student_level),
                "peer_avg_proficiency": round(peer_avg, 2),
                "gap": gap,
            }
        )

    gaps.sort(key=lambda item: float(item["gap"]), reverse=True)
    return gaps[:3]


def _suggest_intervention_type(skill_gaps: list[dict[str, Any]]) -> str:
    if not skill_gaps:
        return "nudge_sent"

    highest_gap = float(skill_gaps[0].get("gap") or 0.0)
    if highest_gap >= 1.5:
        return "mock_assigned"
    if len(skill_gaps) >= 3:
        return "meeting_scheduled"
    return "domain_shift_suggested"


@router.post("/nudge/bulk")
def create_bulk_ai_nudges(
    payload: BulkNudgeRequest,
    current_user: CurrentUser = Depends(require_tpc_admin),
) -> dict[str, Any]:
    generated = generate_bulk_nudges(
        student_ids=payload.student_ids,
        intervention_type=payload.intervention_type,
    )

    output: list[dict[str, Any]] = []
    for item in generated:
        student_id = str(item["student_id"])
        message = str(item["nudge_message"])
        intervention = _safe_intervention_insert(
            student_id=student_id,
            created_by=current_user["id"],
            intervention_type=payload.intervention_type,
            ai_message=message,
            status_value="pending",
        )

        output.append(
            {
                "student_id": student_id,
                "intervention_id": intervention.get("id"),
                "message": message,
            }
        )

    return success(output, "Bulk AI nudges generated")


@router.post("/nudge/{student_id}")
def create_ai_nudge(
    student_id: str,
    payload: NudgeRequest,
    current_user: CurrentUser = Depends(require_tpc_admin),
) -> dict[str, Any]:
    message = generate_nudge(student_id=student_id, intervention_type=payload.intervention_type)
    intervention = _safe_intervention_insert(
        student_id=student_id,
        created_by=current_user["id"],
        intervention_type=payload.intervention_type,
        ai_message=message,
        status_value="pending",
    )

    return success(
        {
            "intervention_id": intervention.get("id"),
            "student_id": student_id,
            "message": message,
            "intervention_type": payload.intervention_type,
        },
        "AI nudge generated",
    )


@router.post("/score/recompute-all")
def recompute_all_scores(
    _: CurrentUser = Depends(require_tpc_admin),
) -> dict[str, Any]:
    started_at = time.perf_counter()
    client = get_supabase_client()

    unplaced_rows = (
        client.table("student_profiles")
        .select("id")
        .neq("placement_status", "placed")
        .execute()
        .data
        or []
    )
    student_ids = [str(row["id"]) for row in unplaced_rows]

    updated_count = 0
    for student_id in student_ids:
        try:
            compute_score(student_id)
            updated_count += 1
        except Exception as exc:
            print(f"[ai_router] recompute failed for student_id={student_id}: {exc}")

    cluster_distribution = run_batch_clustering()
    duration_ms = int((time.perf_counter() - started_at) * 1000)

    return success(
        {
            "students_updated": updated_count,
            "cluster_distribution": cluster_distribution,
            "duration_ms": duration_ms,
        },
        "Scores recomputed for all unplaced students",
    )


@router.post("/alerts/check")
def manual_alert_check(
    _: CurrentUser = Depends(require_tpc_admin),
) -> dict[str, Any]:
    summary = run_alert_check()
    return success(summary, "Alert checks completed")


@router.get("/student/{student_id}/recommendation")
def get_student_recommendation(
    student_id: str,
    current_user: CurrentUser = Depends(get_current_user),
) -> dict[str, Any]:
    _ensure_admin_or_owner(current_user, student_id)

    skill_gaps = _get_skill_gaps(student_id)
    suggested_action = _suggest_intervention_type(skill_gaps)
    message = generate_nudge(student_id=student_id, intervention_type="weekly_recommendation")

    return success(
        {
            "skill_gaps": skill_gaps,
            "suggested_action": suggested_action,
            "message": message,
        },
        "Recommendation generated",
    )
