import uuid
from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.auth.dependencies import CurrentUser, get_current_user, require_student, require_tpc_admin
from app.db.supabase import get_supabase_client
from app.utils.response import success


NotificationStatus = Literal["queued", "sent", "delivered", "failed"]
NotificationChannel = Literal["in_app", "email", "sms", "whatsapp"]


router = APIRouter(tags=["notifications"])


def _ensure_admin_or_owner(current_user: CurrentUser, student_id: str) -> None:
    if current_user["role"] == "tpc_admin":
        return
    if current_user["role"] == "student" and current_user["id"] == student_id:
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Access denied for this student",
    )


@router.get("/student/{student_id}")
def list_student_notifications(
    student_id: uuid.UUID,
    status_filter: NotificationStatus | None = Query(default=None, alias="status"),
    channel: NotificationChannel | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=200),
    current_user: CurrentUser = Depends(get_current_user),
) -> dict[str, Any]:
    student_id_str = str(student_id)
    _ensure_admin_or_owner(current_user, student_id_str)

    client = get_supabase_client()
    query = client.table("notification_log").select("*").eq("student_id", student_id_str)

    if status_filter is not None:
        query = query.eq("status", status_filter)
    if channel is not None:
        query = query.eq("channel", channel)

    start = (page - 1) * limit
    end = start + limit - 1
    rows = query.order("created_at", desc=True).range(start, end).execute().data or []

    return success(
        {
            "page": page,
            "limit": limit,
            "count": len(rows),
            "items": rows,
        },
        "Student notifications fetched",
    )


@router.get("/student/{student_id}/unread-count")
def get_student_unread_count(
    student_id: uuid.UUID,
    current_user: CurrentUser = Depends(get_current_user),
) -> dict[str, Any]:
    student_id_str = str(student_id)
    _ensure_admin_or_owner(current_user, student_id_str)

    client = get_supabase_client()
    rows = (
        client.table("notification_log")
        .select("id")
        .eq("student_id", student_id_str)
        .eq("status", "delivered")
        .eq("is_read", False)
        .execute()
        .data
        or []
    )

    return success({"unread": len(rows)}, "Unread notification count fetched")


@router.patch("/{notification_id}/read")
def mark_notification_read(
    notification_id: uuid.UUID,
    current_user: CurrentUser = Depends(require_student),
) -> dict[str, Any]:
    notification_id_str = str(notification_id)
    client = get_supabase_client()

    rows = (
        client.table("notification_log")
        .update({"is_read": True})
        .eq("id", notification_id_str)
        .eq("student_id", current_user["id"])
        .execute()
        .data
        or []
    )

    if not rows:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")

    return success(rows[0], "Notification marked as read")


@router.get("/feed")
def get_notifications_feed(
    _: CurrentUser = Depends(require_tpc_admin),
) -> dict[str, Any]:
    client = get_supabase_client()

    rows = (
        client.table("notification_log")
        .select("*")
        .order("created_at", desc=True)
        .range(0, 49)
        .execute()
        .data
        or []
    )

    student_ids = list({str(row["student_id"]) for row in rows if row.get("student_id") is not None})
    profile_map: dict[str, dict[str, Any]] = {}

    if student_ids:
        profile_rows = (
            client.table("profiles")
            .select("id, full_name, department")
            .in_("id", student_ids)
            .execute()
            .data
            or []
        )
        profile_map = {str(row["id"]): row for row in profile_rows}

    items: list[dict[str, Any]] = []
    for row in rows:
        student_id = str(row.get("student_id") or "")
        profile = profile_map.get(student_id, {})
        items.append(
            {
                **row,
                "student_name": profile.get("full_name"),
                "student_department": profile.get("department"),
            }
        )

    return success(items, "Notification feed fetched")
