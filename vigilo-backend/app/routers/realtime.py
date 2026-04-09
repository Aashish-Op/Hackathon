from typing import Any

from fastapi import APIRouter, Depends

from app.auth.dependencies import CurrentUser, require_tpc_admin
from app.utils.response import success


router = APIRouter(tags=["realtime"])


@router.get("/channels")
def get_realtime_channels(_: CurrentUser = Depends(require_tpc_admin)) -> dict[str, Any]:
    return success(
        {
            "admin_channels": ["alerts:admin", "scores:admin"],
            "per_student_pattern": (
                "alerts:{student_id} | scores:{student_id} | interventions:{student_id}"
            ),
        },
        "Realtime channel metadata fetched",
    )
