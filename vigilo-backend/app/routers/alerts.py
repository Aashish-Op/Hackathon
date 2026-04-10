from datetime import datetime, timezone
import uuid
from typing import Any, Literal

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from app.auth.dependencies import CurrentUser, require_tpc_admin
from app.db.supabase import broadcast_event, get_supabase_client
from app.utils.response import success


AlertType = Literal["silent_30", "score_drop", "cluster_change", "no_resume", "zero_mocks"]
Severity = Literal["low", "medium", "high", "critical"]


class TriggerAlertRequest(BaseModel):
    student_id: str
    alert_type: AlertType
    severity: Severity
    message: str


router = APIRouter(tags=["alerts"])


@router.get("")
def list_alerts(
    severity: Severity | None = Query(default=None),
    alert_type: AlertType | None = Query(default=None),
    is_resolved: bool | None = Query(default=None),
    student_id: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=200),
    _: CurrentUser = Depends(require_tpc_admin),
) -> dict[str, Any]:
    client = get_supabase_client()
    query = client.table("alerts").select("*")

    if severity is not None:
        query = query.eq("severity", severity)
    if alert_type is not None:
        query = query.eq("alert_type", alert_type)
    if is_resolved is not None:
        query = query.eq("is_resolved", is_resolved)
    if student_id is not None:
        query = query.eq("student_id", student_id)

    start = (page - 1) * limit
    end = start + limit - 1
    rows = query.order("triggered_at", desc=True).range(start, end).execute().data or []

    student_ids = list({str(row["student_id"]) for row in rows if row.get("student_id") is not None})
    student_meta_map: dict[str, dict[str, Any]] = {}
    score_map: dict[str, dict[str, Any]] = {}

    if student_ids:
        profile_rows = (
            client.table("profiles")
            .select("id, full_name, department")
            .in_("id", student_ids)
            .execute()
            .data
            or []
        )
        student_meta_map = {
            str(row["id"]): {
                "student_name": row.get("full_name"),
                "student_department": row.get("department"),
            }
            for row in profile_rows
            if row.get("id") is not None
        }

        score_rows = (
            client.table("vigilo_scores")
            .select("student_id, score, cluster, placement_probability")
            .eq("is_latest", True)
            .in_("student_id", student_ids)
            .execute()
            .data
            or []
        )
        score_map = {
            str(row["student_id"]): row
            for row in score_rows
            if row.get("student_id") is not None
        }

    items: list[dict[str, Any]] = []
    for row in rows:
        student_id = str(row.get("student_id") or "")
        student_meta = student_meta_map.get(student_id, {})
        score_row = score_map.get(student_id)

        resolved_row = {
            **row,
            "student_name": student_meta.get("student_name"),
            "student_department": student_meta.get("student_department"),
            "student_risk_score": float(score_row.get("score") or 0.0)
            if score_row is not None
            else None,
            "student_cluster": str(score_row.get("cluster")) if score_row else None,
            "student_placement_probability": round(
                float(score_row.get("placement_probability") or 0.0) * 100.0,
                2,
            )
            if score_row is not None
            else None,
        }
        items.append(resolved_row)

    return success(
        {
            "page": page,
            "limit": limit,
            "count": len(items),
            "items": items,
        },
        "Alerts fetched",
    )


@router.get("/unread/count")
def get_unread_unresolved_count(
    _: CurrentUser = Depends(require_tpc_admin),
) -> dict[str, Any]:
    client = get_supabase_client()
    rows = (
        client.table("alerts")
        .select("severity")
        .eq("is_read", False)
        .eq("is_resolved", False)
        .execute()
        .data
        or []
    )

    grouped: dict[str, int] = {
        "low": 0,
        "medium": 0,
        "high": 0,
        "critical": 0,
    }
    for row in rows:
        severity = row.get("severity")
        if severity in grouped:
            grouped[severity] += 1

    return success(
        {
            "total": len(rows),
            "by_severity": grouped,
        },
        "Unread unresolved counts fetched",
    )


@router.patch("/{alert_id}/read")
def mark_alert_read(
    alert_id: uuid.UUID,
    _: CurrentUser = Depends(require_tpc_admin),
) -> dict[str, Any]:
    alert_id_str = str(alert_id)
    client = get_supabase_client()
    update_payload = {"is_read": True}
    rows = client.table("alerts").update(update_payload).eq("id", alert_id_str).execute().data or []

    return success(rows[0] if rows else update_payload, "Alert marked as read")


@router.patch("/{alert_id}/resolve")
def resolve_alert(
    alert_id: uuid.UUID,
    current_user: CurrentUser = Depends(require_tpc_admin),
) -> dict[str, Any]:
    alert_id_str = str(alert_id)
    client = get_supabase_client()
    update_payload = {
        "is_resolved": True,
        "is_read": True,
        "resolved_at": datetime.now(timezone.utc).isoformat(),
        "resolved_by": current_user["id"],
    }
    rows = client.table("alerts").update(update_payload).eq("id", alert_id_str).execute().data or []

    resolved_row = rows[0] if rows else update_payload
    broadcast_event(
        channel="alerts:admin",
        event="alert_resolved",
        payload={
            "alert_id": alert_id_str,
            "resolved_by": str(resolved_row.get("resolved_by") or current_user["id"]),
            "resolved_at": str(resolved_row.get("resolved_at") or update_payload["resolved_at"]),
        },
    )

    return success(rows[0] if rows else update_payload, "Alert resolved")


@router.post("/trigger")
def trigger_alert(
    payload: TriggerAlertRequest,
    _: CurrentUser = Depends(require_tpc_admin),
) -> dict[str, Any]:
    client = get_supabase_client()
    insert_payload = payload.model_dump()
    rows = client.table("alerts").insert(insert_payload).execute().data or []

    alert_row = rows[0] if rows else insert_payload
    broadcast_event(
        channel=f"alerts:{payload.student_id}",
        event="new_alert",
        payload={
            "alert_id": alert_row.get("id"),
            "alert_type": str(alert_row.get("alert_type") or payload.alert_type),
            "severity": str(alert_row.get("severity") or payload.severity),
            "message": str(alert_row.get("message") or payload.message),
            "triggered_at": str(
                alert_row.get("triggered_at")
                or datetime.now(timezone.utc).isoformat()
            ),
        },
    )

    return success(rows[0] if rows else insert_payload, "Alert triggered")
