from __future__ import annotations
from collections.abc import AsyncIterator
from .anthropic_config import API_KEY, MAX_TOKENS, MODEL
import anthropic



# build the client
client = anthropic.Anthropic()