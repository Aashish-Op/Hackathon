from datetime import datetime, timedelta, timezone
import uuid
from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from app.auth.dependencies import CurrentUser, get_current_user, require_student, require_tpc_admin
from app.db.supabase import broadcast_event, get_supabase_client
from app.utils.response import success


InterventionType = Literal[
    "nudge_sent",
    "meeting_scheduled",
    "domain_shift_suggested",
    "mock_assigned",
    "counselling",
    "weekly_check_in",
    "weekly_recommendation",
]
InterventionStatus = Literal["pending", "sent", "acknowledged", "completed"]


class InterventionCreateRequest(BaseModel):
    student_id: str
    intervention_type: InterventionType
    custom_message: str | None = None
    ai_generated_message: str | None = None


class CompleteInterventionRequest(BaseModel):
    notes: str | None = None


router = APIRouter(tags=["interventions"])


def _ensure_admin_or_owner(current_user: CurrentUser, student_id: str) -> None:
    if current_user["role"] == "tpc_admin":
        return
    if current_user["role"] == "student" and current_user["id"] == student_id:
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Access denied for this student",
    )


def _get_intervention_or_404(intervention_id: str) -> dict[str, Any]:
    client = get_supabase_client()
    try:
        rows = (
            client.table("interventions")
            .select("*")
            .eq("id", intervention_id)
            .is_("deleted_at", "null")
            .limit(1)
            .execute()
            .data
            or []
        )
    except Exception as exc:
        if "deleted_at" not in str(exc):
            raise
        rows = (
            client.table("interventions")
            .select("*")
            .eq("id", intervention_id)
            .limit(1)
            .execute()
            .data
            or []
        )

    if not rows:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Intervention not found")

    return rows[0]


@router.get("")
def list_interventions(
    student_id: str | None = Query(default=None),
    status_filter: InterventionStatus | None = Query(default=None, alias="status"),
    intervention_type: InterventionType | None = Query(default=None),
    from_date: datetime | None = Query(default=None),
    to_date: datetime | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=200),
    _: CurrentUser = Depends(require_tpc_admin),
) -> dict[str, Any]:
    client = get_supabase_client()
    query = client.table("interventions").select("*").is_("deleted_at", "null")

    if student_id is not None:
        query = query.eq("student_id", student_id)
    if status_filter is not None:
        query = query.eq("status", status_filter)
    if intervention_type is not None:
        query = query.eq("intervention_type", intervention_type)
    if from_date is not None:
        query = query.gte("created_at", from_date.isoformat())
    if to_date is not None:
        query = query.lte("created_at", to_date.isoformat())

    start = (page - 1) * limit
    end = start + limit - 1
    try:
        rows = query.order("created_at", desc=True).range(start, end).execute().data or []
    except Exception as exc:
        if "deleted_at" not in str(exc):
            raise
        fallback_query = client.table("interventions").select("*")
        if student_id is not None:
            fallback_query = fallback_query.eq("student_id", student_id)
        if status_filter is not None:
            fallback_query = fallback_query.eq("status", status_filter)
        if intervention_type is not None:
            fallback_query = fallback_query.eq("intervention_type", intervention_type)
        if from_date is not None:
            fallback_query = fallback_query.gte("created_at", from_date.isoformat())
        if to_date is not None:
            fallback_query = fallback_query.lte("created_at", to_date.isoformat())
        rows = fallback_query.order("created_at", desc=True).range(start, end).execute().data or []

    return success(
        {
            "page": page,
            "limit": limit,
            "count": len(rows),
            "items": rows,
        },
        "Interventions fetched",
    )


@router.get("/{student_id}")
def list_student_interventions(
    student_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
) -> dict[str, Any]:
    student_id_str = str(student_id)
    _ensure_admin_or_owner(current_user, student_id_str)

    client = get_supabase_client()
    try:
        rows = (
            client.table("interventions")
            .select("*")
            .eq("student_id", student_id_str)
            .is_("deleted_at", "null")
            .order("created_at", desc=True)
            .execute()
            .data
            or []
        )
    except Exception as exc:
        if "deleted_at" not in str(exc):
            raise
        rows = (
            client.table("interventions")
            .select("*")
            .eq("student_id", student_id_str)
            .order("created_at", desc=True)
            .execute()
            .data
            or []
        )

    return success(rows, "Student interventions fetched")


@router.post("")
def create_intervention(
    payload: InterventionCreateRequest,
    current_user: CurrentUser = Depends(require_tpc_admin),
) -> dict[str, Any]:
    client = get_supabase_client()
    insert_payload = {
        "student_id": payload.student_id,
        "created_by": current_user["id"],
        "intervention_type": payload.intervention_type,
        "custom_message": payload.custom_message,
        "ai_generated_message": payload.ai_generated_message,
        "status": "pending",
    }

    inserted = client.table("interventions").insert(insert_payload).execute().data or []
    return success(inserted[0] if inserted else insert_payload, "Intervention created")


@router.patch("/{intervention_id}/send")
def send_intervention(
    intervention_id: uuid.UUID,
    _: CurrentUser = Depends(require_tpc_admin),
) -> dict[str, Any]:
    intervention_id_str = str(intervention_id)
    intervention = _get_intervention_or_404(intervention_id_str)

    client = get_supabase_client()
    update_payload = {
        "status": "sent",
        "sent_at": datetime.now(timezone.utc).isoformat(),
    }
    rows = client.table("interventions").update(update_payload).eq("id", intervention_id_str).execute().data or []

    sent_row = rows[0] if rows else intervention
    student_id = str(sent_row.get("student_id") or intervention.get("student_id") or "")
    if student_id:
        message_value = (
            sent_row.get("custom_message")
            or sent_row.get("ai_generated_message")
            or intervention.get("custom_message")
            or intervention.get("ai_generated_message")
            or ""
        )
        sent_at = datetime.now(timezone.utc)
        notification_payload = {
            "intervention_id": intervention_id_str,
            "student_id": student_id,
            "channel": "in_app",
            "status": "sent",
            "message_preview": str(message_value)[:120],
            "sent_at": sent_at.isoformat(),
        }
        notification_rows = client.table("notification_log").insert(notification_payload).execute().data or []
        if notification_rows and notification_rows[0].get("id") is not None:
            delivered_at = sent_at + timedelta(seconds=2)
            client.table("notification_log").update(
                {
                    "status": "delivered",
                    "delivered_at": delivered_at.isoformat(),
                }
            ).eq("id", str(notification_rows[0]["id"])).execute()

        broadcast_event(
            channel=f"interventions:{student_id}",
            event="nudge_received",
            payload={
                "intervention_id": intervention_id_str,
                "intervention_type": str(
                    sent_row.get("intervention_type")
                    or intervention.get("intervention_type")
                    or ""
                ),
                "message_preview": str(message_value)[:80],
            },
        )

    return success(rows[0] if rows else update_payload, "Intervention marked as sent")


@router.patch("/{intervention_id}/acknowledge")
def acknowledge_intervention(
    intervention_id: uuid.UUID,
    current_user: CurrentUser = Depends(require_student),
) -> dict[str, Any]:
    intervention_id_str = str(intervention_id)
    intervention = _get_intervention_or_404(intervention_id_str)
    if str(intervention.get("student_id")) != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Students can only acknowledge their own interventions",
        )

    client = get_supabase_client()
    update_payload = {
        "status": "acknowledged",
        "acknowledged_at": datetime.now(timezone.utc).isoformat(),
    }
    rows = client.table("interventions").update(update_payload).eq("id", intervention_id_str).execute().data or []

    return success(rows[0] if rows else update_payload, "Intervention acknowledged")


@router.patch("/{intervention_id}/complete")
def complete_intervention(
    intervention_id: uuid.UUID,
    payload: CompleteInterventionRequest,
    _: CurrentUser = Depends(require_tpc_admin),
) -> dict[str, Any]:
    intervention_id_str = str(intervention_id)
    _get_intervention_or_404(intervention_id_str)

    client = get_supabase_client()
    update_payload: dict[str, Any] = {
        "status": "completed",
        "notes": payload.notes,
    }
    rows = client.table("interventions").update(update_payload).eq("id", intervention_id_str).execute().data or []

    return success(rows[0] if rows else update_payload, "Intervention completed")


@router.delete("/{intervention_id}")
def soft_delete_intervention(
    intervention_id: uuid.UUID,
    _: CurrentUser = Depends(require_tpc_admin),
) -> dict[str, Any]:
    intervention_id_str = str(intervention_id)
    _get_intervention_or_404(intervention_id_str)

    client = get_supabase_client()
    update_payload = {"deleted_at": datetime.now(timezone.utc).isoformat()}
    try:
        rows = client.table("interventions").update(update_payload).eq("id", intervention_id_str).execute().data or []
        return success(rows[0] if rows else update_payload, "Intervention soft deleted")
    except Exception as exc:
        if "deleted_at" not in str(exc):
            raise
        rows = client.table("interventions").delete().eq("id", intervention_id_str).execute().data or []
        return success(
            rows[0] if rows else {"id": intervention_id_str},
            "Intervention hard deleted (apply migration to enable soft delete)",
        )
