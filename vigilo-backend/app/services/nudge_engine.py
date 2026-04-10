import json
from datetime import datetime, timezone
from typing import Any

from openai import OpenAI

from app.config import settings
from app.db.supabase import get_supabase_client


SYSTEM_PROMPT = (
    "You are Vigilo, an AI placement assistant for college students in India. "
    "Your job is to write a warm, direct, motivating message to a student who is at risk "
    "of missing campus placements. Be specific to their data. Be human, not robotic. "
    "Maximum 120 words."
)

DEFAULT_PROVIDER_ORDER = ("openai", "groq", "cerebras", "nvidia")


def _parse_timestamp(value: str | None) -> datetime | None:
    if not value:
        return None

    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except Exception:
        return None


def _days_since(value: str | None) -> int | None:
    parsed = _parse_timestamp(value)
    if parsed is None:
        return None

    return max((datetime.now(timezone.utc) - parsed).days, 0)


def _parse_provider_order(raw_order: str) -> list[str]:
    providers: list[str] = []
    for raw_name in raw_order.split(","):
        name = raw_name.strip().lower()
        if name and name in DEFAULT_PROVIDER_ORDER and name not in providers:
            providers.append(name)

    return providers or list(DEFAULT_PROVIDER_ORDER)


def _provider_is_configured(provider: str, client_override: OpenAI | None = None) -> bool:
    if provider == "openai":
        return client_override is not None or bool(settings.OPENAI_API_KEY)
    if provider == "groq":
        return bool(settings.GROQ_API_KEY)
    if provider == "cerebras":
        return bool(settings.CEREBRAS_API_KEY)
    if provider == "nvidia":
        return bool(settings.NVIDIA_API_KEY)
    return False


def _provider_model(provider: str) -> str:
    if provider == "openai":
        return settings.OPENAI_MODEL
    if provider == "groq":
        return settings.GROQ_MODEL
    if provider == "cerebras":
        return settings.CEREBRAS_MODEL
    if provider == "nvidia":
        return settings.NVIDIA_MODEL
    raise ValueError(f"Unsupported provider: {provider}")


def _provider_client(provider: str, client_override: OpenAI | None = None) -> OpenAI:
    timeout_seconds = settings.LLM_TIMEOUT_SECONDS

    if provider == "openai":
        return client_override or OpenAI(api_key=settings.OPENAI_API_KEY, timeout=timeout_seconds)
    if provider == "groq":
        return OpenAI(
            api_key=settings.GROQ_API_KEY,
            base_url=settings.GROQ_BASE_URL,
            timeout=timeout_seconds,
        )
    if provider == "cerebras":
        return OpenAI(
            api_key=settings.CEREBRAS_API_KEY,
            base_url=settings.CEREBRAS_BASE_URL,
            timeout=timeout_seconds,
        )
    if provider == "nvidia":
        return OpenAI(
            api_key=settings.NVIDIA_API_KEY,
            base_url=settings.NVIDIA_BASE_URL,
            timeout=timeout_seconds,
        )

    raise ValueError(f"Unsupported provider: {provider}")


def _provider_chain(client_override: OpenAI | None = None) -> list[str]:
    ordered = _parse_provider_order(settings.LLM_PROVIDER_ORDER)
    return [
        provider
        for provider in ordered
        if _provider_is_configured(provider=provider, client_override=client_override)
    ]


def _fetch_student_context(student_id: str) -> dict[str, Any]:
    client = get_supabase_client()

    profile_rows = (
        client.table("profiles")
        .select("id, full_name, department, batch_year")
        .eq("id", student_id)
        .limit(1)
        .execute()
        .data
        or []
    )
    if not profile_rows:
        raise ValueError("Student profile not found")

    student_rows = (
        client.table("student_profiles")
        .select(
            "placement_status, mock_tests_attempted, internship_count, "
            "last_portal_login, resume_updated_at"
        )
        .eq("id", student_id)
        .limit(1)
        .execute()
        .data
        or []
    )
    score_rows = (
        client.table("vigilo_scores")
        .select("score, cluster, score_breakdown, computed_at")
        .eq("student_id", student_id)
        .eq("is_latest", True)
        .limit(1)
        .execute()
        .data
        or []
    )
    if not score_rows:
        score_rows = (
            client.table("vigilo_scores")
            .select("score, cluster, score_breakdown, computed_at")
            .eq("student_id", student_id)
            .order("computed_at", desc=True)
            .limit(1)
            .execute()
            .data
            or []
        )

    skill_rows = (
        client.table("student_skills")
        .select("skill_name, proficiency, verified")
        .eq("student_id", student_id)
        .execute()
        .data
        or []
    )

    profile = profile_rows[0]
    student_profile = student_rows[0] if student_rows else {}
    latest_score = score_rows[0] if score_rows else {}

    return {
        "student_id": student_id,
        "full_name": profile.get("full_name"),
        "department": profile.get("department"),
        "batch_year": profile.get("batch_year"),
        "vigilo_score": latest_score.get("score"),
        "cluster": latest_score.get("cluster"),
        "score_breakdown": latest_score.get("score_breakdown")
        if isinstance(latest_score.get("score_breakdown"), dict)
        else {},
        "skills": skill_rows,
        "placement_status": student_profile.get("placement_status"),
        "mock_tests_attempted": student_profile.get("mock_tests_attempted"),
        "internship_count": student_profile.get("internship_count"),
        "days_since_last_login": _days_since(student_profile.get("last_portal_login")),
        "days_since_resume_update": _days_since(student_profile.get("resume_updated_at")),
    }


def _build_user_prompt(context: dict[str, Any], intervention_type: str) -> str:
    return (
        "Create one personalized nudge for this student.\n"
        f"Intervention type: {intervention_type}\n"
        "Student context (JSON):\n"
        f"{json.dumps(context, ensure_ascii=True, indent=2)}\n\n"
        "Message requirements:\n"
        "- Maximum 120 words\n"
        "- Warm and motivating tone\n"
        "- Include clear, specific actions for this week\n"
        "- Mention their current risk signals"
    )


def _fallback_message(student_name: str | None) -> str:
    name_prefix = f"{student_name}, " if student_name else ""
    return (
        f"{name_prefix}you still have time to turn this around. This week, complete one mock test, "
        "update your resume with your latest work, and apply to at least two suitable roles. "
        "Small consistent steps now can significantly improve your placement outcomes."
    )


def _generate_with_provider(
    provider: str,
    context: dict[str, Any],
    intervention_type: str,
    client: OpenAI | None = None,
) -> str:
    model_client = _provider_client(provider=provider, client_override=client)
    user_prompt = _build_user_prompt(context=context, intervention_type=intervention_type)

    response = model_client.chat.completions.create(
        model=_provider_model(provider),
        temperature=settings.LLM_TEMPERATURE,
        max_tokens=settings.LLM_MAX_TOKENS,
        top_p=1,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
    )

    message = response.choices[0].message.content if response.choices else None
    if message and message.strip():
        return message.strip()

    raise ValueError(f"provider={provider} returned empty content")


def _generate_with_context(
    context: dict[str, Any],
    intervention_type: str,
    client: OpenAI | None = None,
) -> str:
    providers = _provider_chain(client_override=client)
    if not providers:
        print("[nudge_engine] no configured LLM providers; using deterministic fallback message")
        return _fallback_message(context.get("full_name"))

    for provider in providers:
        try:
            generated_message = _generate_with_provider(
                provider=provider,
                context=context,
                intervention_type=intervention_type,
                client=client,
            )
            print(f"[nudge_engine] nudge generated using provider={provider}")
            return generated_message
        except Exception as exc:
            print(f"[nudge_engine] provider={provider} failed: {exc}")

    return _fallback_message(context.get("full_name"))


def _generate_nudge_internal(
    student_id: str,
    intervention_type: str,
    client: OpenAI | None = None,
) -> str:
    context = _fetch_student_context(student_id)
    return _generate_with_context(context=context, intervention_type=intervention_type, client=client)


def generate_nudge(student_id: str, intervention_type: str) -> str:
    try:
        return _generate_nudge_internal(student_id=student_id, intervention_type=intervention_type)
    except Exception as exc:
        print(f"[nudge_engine] generate_nudge failed for student_id={student_id}: {exc}")
        return _fallback_message(None)


def generate_bulk_nudges(student_ids: list[str], intervention_type: str) -> list[dict[str, str]]:
    results: list[dict[str, str]] = []
    for student_id in student_ids:
        try:
            message = _generate_nudge_internal(student_id=student_id, intervention_type=intervention_type)
        except Exception as exc:
            print(f"[nudge_engine] bulk generation failed for student_id={student_id}: {exc}")
            message = _fallback_message(None)

        results.append(
            {
                "student_id": student_id,
                "nudge_message": message,
                "generated_at": datetime.now(timezone.utc).isoformat(),
            }
        )

    return results


class NudgeEngine:
    def __init__(self, client: OpenAI | None = None) -> None:
        self.client = client

    def generate_nudge(
        self,
        student_id: str | dict[str, Any],
        intervention_type: str | list[str],
    ) -> str:
        try:
            if isinstance(student_id, str):
                if not isinstance(intervention_type, str):
                    intervention_type = "nudge_sent"
                return _generate_nudge_internal(
                    student_id=student_id,
                    intervention_type=intervention_type,
                    client=self.client,
                )

            # Backward-compatible mode for existing callers passing context dict.
            context = dict(student_id)
            normalized_type = intervention_type if isinstance(intervention_type, str) else "nudge_sent"
            if isinstance(intervention_type, list):
                context["suggested_actions"] = intervention_type

            return _generate_with_context(context=context, intervention_type=normalized_type, client=self.client)
        except Exception as exc:
            print(f"[nudge_engine] class generate_nudge failed: {exc}")
            return _fallback_message(None)

    def generate_bulk_nudges(self, student_ids: list[str], intervention_type: str) -> list[dict[str, str]]:
        results: list[dict[str, str]] = []
        for student_id in student_ids:
            try:
                message = _generate_nudge_internal(
                    student_id=student_id,
                    intervention_type=intervention_type,
                    client=self.client,
                )
            except Exception as exc:
                print(f"[nudge_engine] class bulk generation failed for student_id={student_id}: {exc}")
                message = _fallback_message(None)

            results.append(
                {
                    "student_id": student_id,
                    "nudge_message": message,
                    "generated_at": datetime.now(timezone.utc).isoformat(),
                }
            )
        return results
