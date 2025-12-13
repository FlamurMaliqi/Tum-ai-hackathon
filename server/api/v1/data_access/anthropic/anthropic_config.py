from __future__ import annotations

import os

API_KEY: str = os.getenv("ANTHROPIC_API_KEY")
MODEL: str = "claude-sonnet-4-5"
MAX_TOKENS: int = 1000

