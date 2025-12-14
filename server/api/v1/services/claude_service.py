from __future__ import annotations

"""Claude (Anthropic) service layer.

This module wraps the Anthropic data-access layer so callers (HTTP routes, WebSockets,
background jobs) depend on the *service* contract rather than directly importing
provider/client code.

Responsibilities:
- Validate/normalize inputs.
- Provide a stable streaming interface for "assistant text".
- Centralize provider error handling/logging.

Non-responsibilities:
- WebSocket frame protocol (owned by `websocket_service.py`).
- Persistence / conversation memory (can be added here later).
"""

from collections.abc import AsyncIterator
import logging
from typing import Optional

from ..data_access.anthropic.agent import (
    stream_anthropic_response,
    stream_anthropic_response_with_history,
    stream_anthropic_response_with_history_and_tools,
)
from ..data_access.tools_runtime import TOOL_DEFINITIONS
from . import message_history_service

logger = logging.getLogger(__name__)


class ClaudeServiceError(RuntimeError):
    """Raised when the Claude service cannot produce a response."""


async def stream_claude_reply(
    *, user_text: str, conversation_id: Optional[str] = None, language: str = "en"
) -> AsyncIterator[str]:
    """Stream assistant text for the provided user text.

    Args:
        user_text: Full text for a single "turn" (already batched by the caller).
        conversation_id: Optional conversation id. When provided, the Anthropic call
            is made with full `messages=[...]` history from `message_history_service`.
        language: Language code ("en" or "de") for the system prompt.

    Yields:
        Text chunks as they arrive from the provider.

    Raises:
        ClaudeServiceError: When the upstream provider fails.
    """
    if not isinstance(user_text, str):
        raise ClaudeServiceError("user_text must be a string")

    normalized = user_text.strip()
    if not normalized:
        return

    try:
        # NO message history is saved since no conversation_id is provided
        if conversation_id is None:
            async for chunk in stream_anthropic_response(normalized, language=language):
                if chunk:
                    yield chunk
        # Message history is saved since a conversation_id is provided
        else:
            messages = await message_history_service.build_anthropic_messages(
                conversation_id=conversation_id,
                tail_messages=40,
            )
            async for chunk in stream_anthropic_response_with_history_and_tools(
                messages=messages, tools=TOOL_DEFINITIONS, language=language
            ):
                if chunk:
                    yield chunk
    except Exception as e:
        # Log once here so non-WS callers also get useful context.
        logger.exception("Claude streaming failed")
        raise ClaudeServiceError("claude_stream_failed") from e
