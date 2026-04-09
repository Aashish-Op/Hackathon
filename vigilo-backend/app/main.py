from contextlib import asynccontextmanager
from typing import Any, AsyncIterator

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth.middleware import SupabaseAuthMiddleware
from app.config import settings
from app.db.supabase import get_supabase_client
from app.routers.ai import router as ai_router
from app.routers.alerts import router as alerts_router
from app.routers.analytics import router as analytics_router
from app.routers.drives import router as drives_router
from app.routers.interventions import router as interventions_router
from app.routers.scores import router as scores_router
from app.routers.students import router as students_router
from app.services.alert_engine import run_alert_check
from app.services.cluster_engine import run_batch_clustering
from app.services.nudge_engine import generate_nudge
from app.services.risk_engine import compute_score
from app.utils.response import success


VALID_INTERVENTION_TYPES: set[str] = {
    "nudge_sent",
    "meeting_scheduled",
    "domain_shift_suggested",
    "mock_assigned",
    "counselling",
    "weekly_check_in",
    "weekly_recommendation",
}


def _normalize_intervention_type(intervention_type: str) -> tuple[str, str | None]:
    value = intervention_type.strip()
    if value in VALID_INTERVENTION_TYPES:
        return value, None

    return "nudge_sent", f"Requested type: {intervention_type}"


def _find_scheduler_actor_id() -> str | None:
    try:
        client = get_supabase_client()
        rows = (
            client.table("profiles")
            .select("id")
            .eq("role", "tpc_admin")
            .limit(1)
            .execute()
            .data
            or []
        )
        if not rows:
            print("[scheduler] no tpc_admin found for automated interventions")
            return None

        return str(rows[0]["id"])
    except Exception as exc:
        print(f"[scheduler] failed to resolve scheduler actor: {exc}")
        return None


def _insert_pending_intervention(
    student_id: str,
    created_by: str,
    intervention_type: str,
    ai_message: str,
) -> None:
    client = get_supabase_client()
    normalized_type, note = _normalize_intervention_type(intervention_type)
    payload: dict[str, Any] = {
        "student_id": student_id,
        "created_by": created_by,
        "intervention_type": normalized_type,
        "ai_generated_message": ai_message,
        "status": "pending",
    }
    if note is not None:
        payload["notes"] = note

    try:
        client.table("interventions").insert(payload).execute()
    except Exception as exc:
        print(
            f"[scheduler] intervention insert failed for student_id={student_id}, "
            f"intervention_type={intervention_type}: {exc}"
        )
        fallback_payload = {
            **payload,
            "intervention_type": "nudge_sent",
            "notes": f"Requested type: {intervention_type}",
        }
        client.table("interventions").insert(fallback_payload).execute()


def _job_daily_alert_check() -> None:
    try:
        summary = run_alert_check()
        print(f"[scheduler] daily alert check completed: {summary}")
    except Exception as exc:
        print(f"[scheduler] daily alert check failed: {exc}")


def _job_daily_score_recompute() -> None:
    try:
        client = get_supabase_client()
        student_rows = (
            client.table("student_profiles")
            .select("id")
            .neq("placement_status", "placed")
            .execute()
            .data
            or []
        )

        updated_ids: list[str] = []
        for row in student_rows:
            student_id = str(row["id"])
            try:
                compute_score(student_id)
                updated_ids.append(student_id)
            except Exception as student_exc:
                print(f"[scheduler] score recompute failed for student_id={student_id}: {student_exc}")

        cluster_summary = run_batch_clustering()
        print(
            "[scheduler] daily score recompute completed: "
            f"updated={len(updated_ids)}, clusters={cluster_summary}"
        )
    except Exception as exc:
        print(f"[scheduler] daily score recompute job failed: {exc}")


def _job_weekly_nudges() -> None:
    try:
        actor_id = _find_scheduler_actor_id()
        if actor_id is None:
            return

        client = get_supabase_client()
        rows = (
            client.table("vigilo_scores")
            .select("student_id")
            .eq("is_latest", True)
            .eq("cluster", "silent_dropout")
            .execute()
            .data
            or []
        )
        student_ids = list({str(row["student_id"]) for row in rows})

        created_count = 0
        for student_id in student_ids:
            try:
                message = generate_nudge(student_id=student_id, intervention_type="weekly_check_in")
                _insert_pending_intervention(
                    student_id=student_id,
                    created_by=actor_id,
                    intervention_type="weekly_check_in",
                    ai_message=message,
                )
                created_count += 1
            except Exception as student_exc:
                print(f"[scheduler] weekly nudge failed for student_id={student_id}: {student_exc}")

        print(f"[scheduler] weekly nudges completed for silent_dropout students: {created_count}")
    except Exception as exc:
        print(f"[scheduler] weekly nudges job failed: {exc}")


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    scheduler = AsyncIOScheduler(timezone="Asia/Kolkata")

    scheduler.add_job(
        _job_daily_alert_check,
        trigger=CronTrigger(hour=2, minute=0, timezone="Asia/Kolkata"),
        id="vigilo_daily_alert_check",
        replace_existing=True,
    )
    scheduler.add_job(
        _job_daily_score_recompute,
        trigger=CronTrigger(hour=3, minute=0, timezone="Asia/Kolkata"),
        id="vigilo_daily_score_recompute",
        replace_existing=True,
    )
    scheduler.add_job(
        _job_weekly_nudges,
        trigger=CronTrigger(day_of_week="sun", hour=6, minute=0, timezone="Asia/Kolkata"),
        id="vigilo_weekly_nudges",
        replace_existing=True,
    )

    scheduler.start()
    print("Vigilo backend running")
    try:
        yield
    finally:
        scheduler.shutdown(wait=False)
        print("Vigilo scheduler stopped")


app = FastAPI(
    title="Vigilo Backend",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(SupabaseAuthMiddleware)

is_dev_env = settings.APP_ENV.lower() in {"dev", "development", "local", "test"}
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if is_dev_env else [],
    allow_credentials=is_dev_env,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(students_router, prefix="/api/v1/students")
app.include_router(scores_router, prefix="/api/v1/scores")
app.include_router(interventions_router, prefix="/api/v1/interventions")
app.include_router(alerts_router, prefix="/api/v1/alerts")
app.include_router(drives_router, prefix="/api/v1/drives")
app.include_router(analytics_router, prefix="/api/v1/analytics")
app.include_router(ai_router, prefix="/api/v1/ai")


@app.get("/health")
def health() -> dict[str, Any]:
    return success(
        {
            "status": "ok",
            "service": "vigilo-backend",
            "env": settings.APP_ENV,
        },
        "Service healthy",
    )
