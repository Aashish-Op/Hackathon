from datetime import datetime, timedelta, timezone
from typing import Any, Literal

from app.db.supabase import broadcast_event, get_supabase_client


AlertType = Literal["silent_30", "score_drop", "cluster_change", "no_resume", "zero_mocks"]
AlertSeverity = Literal["low", "medium", "high", "critical"]


def _parse_timestamp(value: str | None) -> datetime | None:
    if not value:
        return None

    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except Exception:
        return None


def days_since(timestamp: str | None) -> int:
    parsed = _parse_timestamp(timestamp)
    if parsed is None:
        return 1_000_000

    return max((datetime.now(timezone.utc) - parsed).days, 0)


def _has_unresolved_alert(student_id: str, alert_type: AlertType) -> bool:
    try:
        client = get_supabase_client()
        rows = (
            client.table("alerts")
            .select("id")
            .eq("student_id", student_id)
            .eq("alert_type", alert_type)
            .eq("is_resolved", False)
            .limit(1)
            .execute()
            .data
            or []
        )
        return bool(rows)
    except Exception as exc:
        print(
            f"[alert_engine] failed checking unresolved alerts for student_id={student_id}, "
            f"alert_type={alert_type}: {exc}"
        )
        return True


def _insert_alert(
    student_id: str,
    alert_type: AlertType,
    severity: AlertSeverity,
    message: str,
) -> bool:
    try:
        if _has_unresolved_alert(student_id=student_id, alert_type=alert_type):
            return False

        client = get_supabase_client()
        inserted_rows = (
            client.table("alerts")
            .insert(
                {
                    "student_id": student_id,
                    "alert_type": alert_type,
                    "severity": severity,
                    "message": message,
                }
            )
            .execute()
            .data
            or []
        )

        alert_row = inserted_rows[0] if inserted_rows else {}
        broadcast_event(
            channel=f"alerts:{student_id}",
            event="new_alert",
            payload={
                "alert_id": alert_row.get("id"),
                "alert_type": str(alert_row.get("alert_type") or alert_type),
                "severity": str(alert_row.get("severity") or severity),
                "message": str(alert_row.get("message") or message),
                "triggered_at": str(
                    alert_row.get("triggered_at")
                    or datetime.now(timezone.utc).isoformat()
                ),
            },
        )

        return True
    except Exception as exc:
        print(
            f"[alert_engine] failed inserting alert for student_id={student_id}, "
            f"alert_type={alert_type}: {exc}"
        )
        return False


def run_alert_check() -> dict[str, int]:
    summary: dict[str, int] = {
        "silent_30": 0,
        "score_drop": 0,
        "cluster_change": 0,
        "no_resume": 0,
        "zero_mocks": 0,
    }

    try:
        client = get_supabase_client()
        now = datetime.now(timezone.utc)
        current_year = now.year

        profiles = (
            client.table("profiles")
            .select("id, full_name, batch_year, created_at")
            .eq("role", "student")
            .execute()
            .data
            or []
        )
        student_profiles = (
            client.table("student_profiles")
            .select("id, placement_status, resume_updated_at, mock_tests_attempted, created_at")
            .execute()
            .data
            or []
        )
        student_profile_map = {str(row["id"]): row for row in student_profiles}

        activity_cutoff = (now - timedelta(days=30)).isoformat()
        score_cutoff = now - timedelta(days=7)

        for profile in profiles:
            student_id = str(profile.get("id"))
            if not student_id:
                continue

            try:
                student_profile: dict[str, Any] = student_profile_map.get(student_id, {})
                full_name = profile.get("full_name") or "Student"
                placement_status = str(student_profile.get("placement_status") or "unplaced")

                # Rule 1: silent_30
                recent_activity_rows = (
                    client.table("activity_logs")
                    .select("id")
                    .eq("student_id", student_id)
                    .gte("logged_at", activity_cutoff)
                    .limit(1)
                    .execute()
                    .data
                    or []
                )
                if placement_status != "placed" and not recent_activity_rows:
                    inserted = _insert_alert(
                        student_id=student_id,
                        alert_type="silent_30",
                        severity="high",
                        message=(
                            f"{full_name} has no placement-related activity recorded in the last 30 days."
                        ),
                    )
                    if inserted:
                        summary["silent_30"] += 1

                score_rows = (
                    client.table("vigilo_scores")
                    .select("score, cluster, computed_at")
                    .eq("student_id", student_id)
                    .order("computed_at", desc=True)
                    .limit(20)
                    .execute()
                    .data
                    or []
                )

                if score_rows:
                    latest = score_rows[0]
                    latest_score = float(latest.get("score") or 0.0)
                    latest_cluster = str(latest.get("cluster") or "")

                    # Rule 2: score_drop (latest is 10+ points lower than score 7 days ago)
                    baseline_row: dict[str, Any] | None = None
                    for row in score_rows[1:]:
                        computed_at = _parse_timestamp(row.get("computed_at"))
                        if computed_at is not None and computed_at <= score_cutoff:
                            baseline_row = row
                            break

                    if baseline_row is None:
                        baseline_rows = (
                            client.table("vigilo_scores")
                            .select("score, computed_at")
                            .eq("student_id", student_id)
                            .lte("computed_at", score_cutoff.isoformat())
                            .order("computed_at", desc=True)
                            .limit(1)
                            .execute()
                            .data
                            or []
                        )
                        if baseline_rows:
                            baseline_row = baseline_rows[0]

                    if baseline_row is not None:
                        baseline_score = float(baseline_row.get("score") or 0.0)
                        if baseline_score - latest_score >= 10.0:
                            inserted = _insert_alert(
                                student_id=student_id,
                                alert_type="score_drop",
                                severity="medium",
                                message=(
                                    f"{full_name}'s Vigilo Score dropped by "
                                    f"{(baseline_score - latest_score):.2f} points versus one week ago."
                                ),
                            )
                            if inserted:
                                summary["score_drop"] += 1

                    # Rule 3: cluster_change to silent_dropout in latest computation
                    if latest_cluster == "silent_dropout" and len(score_rows) >= 2:
                        previous_cluster = str(score_rows[1].get("cluster") or "")
                        if previous_cluster != "silent_dropout":
                            inserted = _insert_alert(
                                student_id=student_id,
                                alert_type="cluster_change",
                                severity="critical",
                                message=(
                                    f"{full_name} has moved into silent_dropout cluster in the latest score run."
                                ),
                            )
                            if inserted:
                                summary["cluster_change"] += 1

                # Rule 4: no_resume for final-year students
                batch_year = int(profile.get("batch_year") or 0)
                resume_updated_at = student_profile.get("resume_updated_at")
                if batch_year == current_year and (
                    resume_updated_at is None or days_since(resume_updated_at) > 60
                ):
                    inserted = _insert_alert(
                        student_id=student_id,
                        alert_type="no_resume",
                        severity="medium",
                        message=(
                            f"{full_name}'s resume is missing or has not been updated in the last 60 days."
                        ),
                    )
                    if inserted:
                        summary["no_resume"] += 1

                # Rule 5: zero_mocks with enrollment older than 60 days
                mock_tests_attempted = int(student_profile.get("mock_tests_attempted") or 0)
                enrollment_ts = student_profile.get("created_at") or profile.get("created_at")
                if mock_tests_attempted == 0 and days_since(enrollment_ts) > 60:
                    inserted = _insert_alert(
                        student_id=student_id,
                        alert_type="zero_mocks",
                        severity="low",
                        message=(
                            f"{full_name} has not attempted any mock tests more than 60 days after enrollment."
                        ),
                    )
                    if inserted:
                        summary["zero_mocks"] += 1
            except Exception as student_exc:
                print(f"[alert_engine] student rule evaluation failed for student_id={student_id}: {student_exc}")
                continue

        return summary
    except Exception as exc:
        print(f"[alert_engine] run_alert_check failed: {exc}")
        return summary
