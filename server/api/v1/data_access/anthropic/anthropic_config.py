from __future__ import annotations

import os

# Currently being read by the compose.yaml file.
# API_KEY: str = os.getenv("ANTHROPIC_API_KEY")
MODEL: str = "claude-sonnet-4-5"
MAX_TOKENS: int = 1000

SYSTEM_PROMPT: str = """
Just add a sentence to the conversation, based on the user's input. I just want to test the response. Make sure the sentence ends with "ANTHROPIC RESPONDING".
"""

