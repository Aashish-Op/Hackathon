from typing import Any

from fastapi import Request
from jose import JWTError, jwt
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

from app.config import settings
from app.db.supabase import get_supabase_client


def _get_role(user_id: str) -> str | None:
    client = get_supabase_client()
    response = client.table("profiles").select("role").eq("id", user_id).limit(1).execute()
    rows = response.data or []

    if not rows:
        return None

    role = rows[0].get("role")
    if role not in {"tpc_admin", "student"}:
        return None

    return str(role)


class SupabaseAuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        request.state.user = None

        authorization = request.headers.get("Authorization", "")
        scheme, _, token = authorization.partition(" ")

        if scheme.lower() == "bearer" and token:
            try:
                payload: dict[str, Any] = jwt.decode(
                    token,
                    settings.SUPABASE_JWT_SECRET,
                    algorithms=["HS256"],
                    options={"verify_aud": False},
                )
                user_id = payload.get("sub")
                if user_id:
                    role = _get_role(str(user_id))
                    if role:
                        request.state.user = {"id": str(user_id), "role": role}
            except JWTError:
                request.state.user = None

        return await call_next(request)
