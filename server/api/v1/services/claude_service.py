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

from ..data_access.anthropic.agent import stream_anthropic_response

logger = logging.getLogger(__name__)


class ClaudeServiceError(RuntimeError):
    """Raised when the Claude service cannot produce a response."""


async def stream_claude_reply(*, user_text: str) -> AsyncIterator[str]:
    """Stream assistant text for the provided user text.

    Args:
        user_text: Full text for a single "turn" (already batched by the caller).

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
        async for chunk in stream_anthropic_response(normalized):
            if chunk:
                yield chunk
    except Exception as e:
        # Log once here so non-WS callers also get useful context.
        logger.exception("Claude streaming failed")
        raise ClaudeServiceError("claude_stream_failed") from e
