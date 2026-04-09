import asyncio
import logging
from typing import Any, Optional

import httpx
from supabase import Client, create_client

from app.config import settings


_supabase_client: Optional[Client] = None
logger = logging.getLogger(__name__)


def get_supabase_client() -> Client:
    global _supabase_client

    if _supabase_client is None:
        _supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

    return _supabase_client


async def _broadcast_event_async(channel: str, event: str, payload: dict[str, Any]) -> None:
    url = f"{settings.SUPABASE_URL.rstrip('/')}/realtime/v1/api/broadcast"
    headers = {
        "apikey": settings.SUPABASE_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_KEY}",
        "Content-Type": "application/json",
    }
    body = {
        "messages": [
            {
                "topic": channel,
                "event": event,
                "payload": payload,
            }
        ]
    }

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(url, headers=headers, json=body)
            response.raise_for_status()
    except Exception as exc:
        logger.error(
            "realtime broadcast failed channel=%s event=%s error=%s",
            channel,
            event,
            exc,
        )


def broadcast_event(channel: str, event: str, payload: dict[str, Any]) -> None:
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        asyncio.run(_broadcast_event_async(channel=channel, event=event, payload=payload))
        return

    try:
        loop.create_task(_broadcast_event_async(channel=channel, event=event, payload=payload))
    except Exception as exc:
        logger.error(
            "realtime broadcast scheduling failed channel=%s event=%s error=%s",
            channel,
            event,
            exc,
        )


supabase: Client = get_supabase_client()
