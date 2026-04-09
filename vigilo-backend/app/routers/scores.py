from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field, model_validator

from app.auth.dependencies import CurrentUser, get_current_user, require_tpc_admin
from app.db.supabase import get_supabase_client
from app.services import risk_engine
from app.utils.response import success


router = APIRouter(tags=["scores"])


class RecomputeBatchRequest(BaseModel):
    student_ids: list[str] | None = Field(default=None)
    batch_year: int | None = None
    department: str | None = None

    @model_validator(mode="after")
    def validate_payload(self) -> "RecomputeBatchRequest":
        has_ids = bool(self.student_ids)
        has_batch_filter = self.batch_year is not None and self.department is not None

        if not has_ids and not has_batch_filter:
            raise ValueError("Provide student_ids or both batch_year and department")

        return self


def _ensure_admin_or_owner(current_user: CurrentUser, student_id: str) -> None:
    if current_user["role"] == "tpc_admin":
        return

    if current_user["role"] == "student" and current_user["id"] == student_id:
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Access denied for this student",
    )


def _profile_map(student_ids: list[str]) -> dict[str, dict[str, Any]]:
    if not student_ids:
        return {}

    client = get_supabase_client()
    rows = (
        client.table("profiles")
        .select("id, full_name, department, batch_year")
        .in_("id", student_ids)
        .execute()
        .data
        or []
    )
    return {str(row["id"]): row for row in rows}


@router.get("/{student_id}/history")
def get_score_history(
    student_id: str,
    current_user: CurrentUser = Depends(get_current_user),
) -> dict[str, Any]:
    _ensure_admin_or_owner(current_user, student_id)

    client = get_supabase_client()
    rows = (
        client.table("vigilo_scores")
        .select("*")
        .eq("student_id", student_id)
        .order("computed_at", desc=True)
        .execute()
        .data
        or []
    )

    return success(rows, "Score history fetched")


@router.get("/{student_id}/latest")
def get_latest_score(
    student_id: str,
    current_user: CurrentUser = Depends(get_current_user),
) -> dict[str, Any]:
    _ensure_admin_or_owner(current_user, student_id)

    client = get_supabase_client()
    rows = (
        client.table("vigilo_scores")
        .select("*")
        .eq("student_id", student_id)
        .eq("is_latest", True)
        .limit(1)
        .execute()
        .data
        or []
    )

    if not rows:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Latest score not found")

    return success(rows[0], "Latest score fetched")


@router.post("/recompute/batch")
def recompute_batch_scores(
    payload: RecomputeBatchRequest,
    _: CurrentUser = Depends(require_tpc_admin),
) -> dict[str, Any]:
    client = get_supabase_client()

    target_ids: list[str] = []
    if payload.student_ids:
        target_ids = [str(student_id) for student_id in payload.student_ids]
    else:
        query = client.table("profiles").select("id").eq("role", "student")
        query = query.eq("batch_year", payload.batch_year)
        query = query.eq("department", payload.department)
        rows = query.execute().data or []
        target_ids = [str(row["id"]) for row in rows]

    updated_scores: list[dict[str, Any]] = []
    failures: list[dict[str, str]] = []

    for student_id in target_ids:
        try:
            updated_scores.append(risk_engine.compute_score(student_id))
        except Exception as exc:
            failures.append({"student_id": student_id, "error": str(exc)})

    return success(
        {
            "updated_count": len(updated_scores),
            "failed_count": len(failures),
            "updated_scores": updated_scores,
            "failures": failures,
        },
        "Batch score recomputation completed",
    )


@router.post("/recompute/{student_id}")
def recompute_score_for_student(
    student_id: str,
    _: CurrentUser = Depends(require_tpc_admin),
) -> dict[str, Any]:
    try:
        score_row = risk_engine.compute_score(student_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    return success(score_row, "Score recomputed")


@router.get("/leaderboard")
def score_leaderboard(
    _: CurrentUser = Depends(require_tpc_admin),
    limit: int = Query(default=20, ge=1, le=100),
) -> dict[str, Any]:
    client = get_supabase_client()

    latest_scores = (
        client.table("vigilo_scores")
        .select("id, student_id, score, cluster, placement_probability, computed_at")
        .eq("is_latest", True)
        .execute()
        .data
        or []
    )

    ranked_desc = sorted(latest_scores, key=lambda row: float(row.get("score") or 0.0), reverse=True)
    ranked_asc = sorted(latest_scores, key=lambda row: float(row.get("score") or 0.0))

    top_scores = ranked_desc[:limit]
    bottom_scores = ranked_asc[:limit]

    all_student_ids = list({str(item["student_id"]) for item in [*top_scores, *bottom_scores]})
    profiles = _profile_map(all_student_ids)

    def _decorate(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
        output: list[dict[str, Any]] = []
        for row in rows:
            student_id = str(row["student_id"])
            profile = profiles.get(student_id, {})
            output.append(
                {
                    **row,
                    "student_name": profile.get("full_name"),
                    "department": profile.get("department"),
                    "batch_year": profile.get("batch_year"),
                }
            )
        return output

    return success(
        {
            "highest": _decorate(top_scores),
            "lowest": _decorate(bottom_scores),
        },
        "Leaderboard fetched",
    )
