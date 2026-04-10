import math
from datetime import datetime, timedelta, timezone
from typing import Any

from app.db.supabase import get_supabase_client
from app.services.cluster_engine import assign_cluster


def _parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None

    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except Exception:
        return None


def _score_portal_activity(login_count: int) -> float:
    if login_count <= 0:
        return 0.0
    if login_count <= 2:
        return 5.0
    if login_count <= 5:
        return 8.0
    if login_count < 10:
        return 12.0
    return 15.0


def _score_mock_test(attempts: int, avg_score: float) -> float:
    if attempts <= 0:
        return 0.0

    score = ((attempts / 10.0) * 10.0) + ((avg_score / 100.0) * 10.0)
    return round(min(20.0, max(0.0, score)), 2)


def _score_skill(certifications_count: int, verified_skills_count: int) -> float:
    return round(min(15.0, (certifications_count * 2.0) + (verified_skills_count * 3.0)), 2)


def _score_resume(resume_updated_at: str | None) -> float:
    updated_at = _parse_datetime(resume_updated_at)
    if updated_at is None:
        return 0.0

    days_ago = max((datetime.now(timezone.utc) - updated_at).days, 0)
    if days_ago < 30:
        return 10.0
    if days_ago <= 90:
        return 5.0
    return 0.0


def _score_cgpa(cgpa: float) -> float:
    bounded = min(max(cgpa, 0.0), 10.0)
    return round((bounded / 10.0) * 15.0, 2)


def _score_application(application_count_60d: int) -> float:
    return round(min(15.0, application_count_60d * 3.0), 2)


def _score_internship(internship_count: int) -> float:
    return round(min(10.0, internship_count * 5.0), 2)


def compute_score(student_id: str) -> dict[str, Any]:
    try:
        client = get_supabase_client()

        student_rows = (
            client.table("student_profiles")
            .select(
                "id, cgpa, internship_count, mock_tests_attempted, mock_avg_score, "
                "certifications_count, resume_updated_at"
            )
            .eq("id", student_id)
            .limit(1)
            .execute()
            .data
            or []
        )
        if not student_rows:
            raise ValueError("Student profile not found")

        student = student_rows[0]

        now = datetime.now(timezone.utc)
        login_cutoff = (now - timedelta(days=30)).isoformat()
        application_cutoff = (now - timedelta(days=60)).isoformat()

        portal_logins = (
            client.table("activity_logs")
            .select("id")
            .eq("student_id", student_id)
            .eq("activity_type", "portal_login")
            .gte("logged_at", login_cutoff)
            .execute()
            .data
            or []
        )

        verified_skills = (
            client.table("student_skills")
            .select("id")
            .eq("student_id", student_id)
            .eq("verified", True)
            .execute()
            .data
            or []
        )

        recent_applications = (
            client.table("drive_applications")
            .select("id")
            .eq("student_id", student_id)
            .gte("applied_at", application_cutoff)
            .execute()
            .data
            or []
        )

        portal_activity_score = _score_portal_activity(len(portal_logins))
        mock_test_score = _score_mock_test(
            attempts=int(student.get("mock_tests_attempted") or 0),
            avg_score=float(student.get("mock_avg_score") or 0.0),
        )
        skill_score = _score_skill(
            certifications_count=int(student.get("certifications_count") or 0),
            verified_skills_count=len(verified_skills),
        )
        resume_score = _score_resume(student.get("resume_updated_at"))
        cgpa_score = _score_cgpa(float(student.get("cgpa") or 0.0))
        application_score = _score_application(len(recent_applications))
        internship_score = _score_internship(int(student.get("internship_count") or 0))

        total_score = round(
            portal_activity_score
            + mock_test_score
            + skill_score
            + resume_score
            + cgpa_score
            + application_score
            + internship_score,
            2,
        )
        total_score = round(min(100.0, max(0.0, total_score)), 2)

        placement_probability = round(1.0 / (1.0 + math.exp(-0.1 * (total_score - 50.0))), 4)
        cluster = assign_cluster(score=total_score, probability=placement_probability)

        score_breakdown: dict[str, float] = {
            "portal_activity_score": portal_activity_score,
            "mock_test_score": mock_test_score,
            "skill_score": skill_score,
            "resume_score": resume_score,
            "cgpa_score": cgpa_score,
            "application_score": application_score,
            "internship_score": internship_score,
            "total_score": total_score,
        }

        insert_payload: dict[str, Any] = {
            "student_id": student_id,
            "score": total_score,
            "placement_probability": placement_probability,
            "cluster": cluster,
            "score_breakdown": score_breakdown,
            "is_latest": True,
        }

        inserted_rows = client.table("vigilo_scores").insert(insert_payload).execute().data or []
        persisted = inserted_rows[0] if inserted_rows else insert_payload

        return {
            "student_id": str(persisted.get("student_id") or student_id),
            "score": float(persisted.get("score") or total_score),
            "placement_probability": float(
                persisted.get("placement_probability") or placement_probability
            ),
            "cluster": str(persisted.get("cluster") or cluster),
            "computed_at": str(persisted.get("computed_at") or now.isoformat()),
            "score_breakdown": (
                persisted.get("score_breakdown")
                if isinstance(persisted.get("score_breakdown"), dict)
                else score_breakdown
            ),
        }
    except Exception as exc:
        print(f"[risk_engine] compute_score failed for student_id={student_id}: {exc}")
        raise
