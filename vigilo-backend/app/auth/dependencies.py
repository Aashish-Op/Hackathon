from typing import Any, Literal, TypedDict

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.config import settings
from app.db.supabase import get_supabase_client


class CurrentUser(TypedDict):
    id: str
    role: Literal["tpc_admin", "student"]


bearer_scheme = HTTPBearer(auto_error=False)


def _is_dev_bypass_enabled() -> bool:
    return settings.ALLOW_DEV_AUTH_BYPASS and settings.APP_ENV.lower() in {
        "dev",
        "development",
        "local",
        "test",
    }


def _resolve_dev_user() -> CurrentUser | None:
    client = get_supabase_client()

    admin_rows = (
        client.table("profiles")
        .select("id")
        .eq("role", "tpc_admin")
        .limit(1)
        .execute()
        .data
        or []
    )
    if admin_rows:
        return {"id": str(admin_rows[0]["id"]), "role": "tpc_admin"}

    student_rows = (
        client.table("profiles")
        .select("id")
        .eq("role", "student")
        .limit(1)
        .execute()
        .data
        or []
    )
    if student_rows:
        return {"id": str(student_rows[0]["id"]), "role": "student"}

    return None


def _decode_supabase_jwt(token: str) -> dict[str, Any]:
    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject",
        )

    return payload


def _resolve_role(user_id: str) -> Literal["tpc_admin", "student"]:
    client = get_supabase_client()
    response = client.table("profiles").select("role").eq("id", user_id).limit(1).execute()

    data = response.data or []
    if not data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User profile not found",
        )

    role = data[0].get("role")
    if role not in {"tpc_admin", "student"}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid role",
        )

    return role


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> CurrentUser:
    if credentials is None or credentials.scheme.lower() != "bearer":
        if _is_dev_bypass_enabled():
            dev_user = _resolve_dev_user()
            if dev_user is not None:
                return dev_user
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bearer token is required",
        )

    try:
        payload = _decode_supabase_jwt(credentials.credentials)
    except HTTPException:
        if _is_dev_bypass_enabled():
            dev_user = _resolve_dev_user()
            if dev_user is not None:
                return dev_user
        raise

    user_id = str(payload["sub"])
    role = _resolve_role(user_id)

    return {"id": user_id, "role": role}


def require_tpc_admin(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    if current_user["role"] != "tpc_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="TPC admin access required",
        )

    return current_user


def require_student(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    if current_user["role"] != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student access required",
        )

    return current_user
