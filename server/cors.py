import os
from typing import List, Tuple

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


def _default_allowed_origins() -> List[str]:
    # Common local dev ports (Vite/React/etc.)
    return [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:8083",
        "http://127.0.0.1:8083",
    ]


def _parse_allowed_origins_env() -> List[str]:
    raw = (os.getenv("CORS_ALLOW_ORIGINS") or "").strip()
    if not raw:
        return _default_allowed_origins()
    # Comma-separated list, e.g. "http://localhost:3000,http://127.0.0.1:3000"
    origins = [o.strip() for o in raw.split(",") if o.strip()]
    return origins or _default_allowed_origins()


def _cors_settings() -> Tuple[List[str], bool]:
    """
    Returns (allow_origins, allow_credentials).
    If '*' is configured, we must disable credentials per CORS spec.
    """
    origins = _parse_allowed_origins_env()
    if "*" in origins:
        return ["*"], False
    return origins, True


def configure_cors(app: FastAPI) -> None:
    allow_origins, allow_credentials = _cors_settings()
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allow_origins,
        allow_credentials=allow_credentials,
        allow_methods=["*"],
        allow_headers=["*"],
    )

