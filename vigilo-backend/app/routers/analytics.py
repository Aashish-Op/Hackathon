from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.auth.dependencies import CurrentUser, require_tpc_admin
from app.db.supabase import get_supabase_client
from app.utils.response import success


router = APIRouter(tags=["analytics"])


def _safe_avg(values: list[float]) -> float:
    if not values:
        return 0.0
    return round(sum(values) / len(values), 2)


@router.get("/overview")
def analytics_overview(_: CurrentUser = Depends(require_tpc_admin)) -> dict[str, Any]:
    client = get_supabase_client()

    students = client.table("profiles").select("id").eq("role", "student").execute().data or []
    student_profiles = client.table("student_profiles").select("id, placement_status").execute().data or []
    latest_scores = (
        client.table("vigilo_scores")
        .select("student_id, score, cluster")
        .eq("is_latest", True)
        .execute()
        .data
        or []
    )
    alerts_open = client.table("alerts").select("id").eq("is_resolved", False).execute().data or []

    total_students = len(students)
    placed_count = sum(1 for row in student_profiles if row.get("placement_status") == "placed")
    at_risk_count = sum(1 for row in latest_scores if row.get("cluster") == "at_risk")
    silent_dropout_count = sum(1 for row in latest_scores if row.get("cluster") == "silent_dropout")
    placement_rate = round((placed_count / total_students) * 100.0, 2) if total_students > 0 else 0.0
    avg_vigilo_score = _safe_avg([float(row.get("score") or 0.0) for row in latest_scores])

    return success(
        {
            "total_students": total_students,
            "placed_count": placed_count,
            "at_risk_count": at_risk_count,
            "silent_dropout_count": silent_dropout_count,
            "placement_rate": placement_rate,
            "avg_vigilo_score": avg_vigilo_score,
            "alerts_open": len(alerts_open),
        },
        "Analytics overview fetched",
    )


@router.get("/cluster-distribution")
def cluster_distribution(_: CurrentUser = Depends(require_tpc_admin)) -> dict[str, Any]:
    client = get_supabase_client()
    latest_scores = (
        client.table("vigilo_scores")
        .select("cluster")
        .eq("is_latest", True)
        .execute()
        .data
        or []
    )

    total = len(latest_scores)
    counts = {
        "placement_ready": 0,
        "at_risk": 0,
        "silent_dropout": 0,
    }
    for row in latest_scores:
        cluster = row.get("cluster")
        if cluster in counts:
            counts[cluster] += 1

    items = []
    for cluster, count in counts.items():
        percentage = round((count / total) * 100.0, 2) if total > 0 else 0.0
        items.append(
            {
                "cluster": cluster,
                "count": count,
                "percentage": percentage,
            }
        )

    return success({"total": total, "items": items}, "Cluster distribution fetched")


@router.get("/department-breakdown")
def department_breakdown(_: CurrentUser = Depends(require_tpc_admin)) -> dict[str, Any]:
    client = get_supabase_client()

    profiles = (
        client.table("profiles")
        .select("id, department")
        .eq("role", "student")
        .execute()
        .data
        or []
    )
    student_profiles = client.table("student_profiles").select("id, placement_status").execute().data or []
    latest_scores = (
        client.table("vigilo_scores")
        .select("student_id, score, cluster")
        .eq("is_latest", True)
        .execute()
        .data
        or []
    )

    placement_map = {str(row["id"]): row.get("placement_status") for row in student_profiles}
    score_map = {str(row["student_id"]): row for row in latest_scores}

    grouped: dict[str, dict[str, Any]] = {}
    for row in profiles:
        student_id = str(row["id"])
        department = row.get("department") or "Unknown"

        if department not in grouped:
            grouped[department] = {
                "department": department,
                "student_count": 0,
                "placed_count": 0,
                "score_sum": 0.0,
                "score_count": 0,
                "at_risk_count": 0,
            }

        group = grouped[department]
        group["student_count"] += 1

        if placement_map.get(student_id) == "placed":
            group["placed_count"] += 1

        score_row = score_map.get(student_id)
        if score_row is not None:
            group["score_sum"] += float(score_row.get("score") or 0.0)
            group["score_count"] += 1
            if score_row.get("cluster") == "at_risk":
                group["at_risk_count"] += 1

    items = []
    for department, values in sorted(grouped.items()):
        avg_score = round(values["score_sum"] / values["score_count"], 2) if values["score_count"] > 0 else 0.0
        items.append(
            {
                "department": department,
                "student_count": values["student_count"],
                "placed_count": values["placed_count"],
                "avg_score": avg_score,
                "at_risk_count": values["at_risk_count"],
            }
        )

    return success(items, "Department breakdown fetched")


@router.get("/score-trend")
def score_trend(
    student_id: str | None = Query(default=None),
    department: str | None = Query(default=None),
    _: CurrentUser = Depends(require_tpc_admin),
) -> dict[str, Any]:
    client = get_supabase_client()

    if student_id is not None and department is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide either student_id or department, not both",
        )

    since = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    query = client.table("vigilo_scores").select("student_id, score, computed_at").gte("computed_at", since)

    if student_id is not None:
        query = query.eq("student_id", student_id)
    elif department is not None:
        profile_rows = (
            client.table("profiles")
            .select("id")
            .eq("role", "student")
            .eq("department", department)
            .execute()
            .data
            or []
        )
        department_ids = [str(row["id"]) for row in profile_rows]
        if not department_ids:
            return success([], "Score trend fetched")
        query = query.in_("student_id", department_ids)

    rows = query.order("computed_at").execute().data or []

    grouped: dict[str, list[float]] = {}
    for row in rows:
        computed_at = str(row.get("computed_at") or "")
        day_key = computed_at[:10]
        grouped.setdefault(day_key, []).append(float(row.get("score") or 0.0))

    items = []
    for day in sorted(grouped.keys()):
        items.append({"date": day, "avg_score": _safe_avg(grouped[day])})

    return success(items, "Score trend fetched")


@router.get("/impact-simulation")
def impact_simulation(
    top_n: int = Query(default=50, ge=1, le=10000),
    _: CurrentUser = Depends(require_tpc_admin),
) -> dict[str, Any]:
    client = get_supabase_client()

    students = client.table("profiles").select("id").eq("role", "student").execute().data or []
    student_profiles = client.table("student_profiles").select("id, placement_status").execute().data or []
    total_students = len(students)
    placed_count = sum(1 for row in student_profiles if row.get("placement_status") == "placed")

    at_risk_rows = (
        client.table("vigilo_scores")
        .select("student_id, score, cluster")
        .eq("is_latest", True)
        .in_("cluster", ["at_risk", "silent_dropout"])
        .order("score", desc=True)
        .execute()
        .data
        or []
    )

    candidates = at_risk_rows[:top_n]
    students_impacted = len(candidates)
    positive_responses = int(round(students_impacted * 0.6))
    projected_placed = min(total_students, placed_count + positive_responses)

    current_rate = round((placed_count / total_students) * 100.0, 2) if total_students > 0 else 0.0
    projected_rate = round((projected_placed / total_students) * 100.0, 2) if total_students > 0 else 0.0

    return success(
        {
            "current_rate": current_rate,
            "projected_rate": projected_rate,
            "students_impacted": students_impacted,
        },
        "Impact simulation completed",
    )
