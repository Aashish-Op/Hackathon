from typing import Any


def success(data: Any = None, message: str = "Success") -> dict[str, Any]:
    return {
        "success": True,
        "data": data,
        "message": message,
    }


def error(message: str = "Error", data: Any = None) -> dict[str, Any]:
    return {
        "success": False,
        "data": data,
        "message": message,
    }
