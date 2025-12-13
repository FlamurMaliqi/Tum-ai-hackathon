from __future__ import annotations

"""
Message history service layer (in-memory).

This module owns a simple, asyncio-safe, in-memory store of per-conversation
messages so other service layers can provide model "memory" (context) without
coupling to any specific transport (WebSocket/HTTP) or provider SDK.

Responsibilities:
- Store chat history for a conversation (role + text).
- Provide safe read access (copies) for callers.
- Provide Anthropic-compatible `messages=[...]` payloads from stored history.
- Apply safety limits (message count, character count, conversation count).

Non-responsibilities:
- WebSocket frame protocol / turn buffering (see `websocket_service.py`).
- Calling Anthropic / streaming tokens (see `claude_service.py` and data access).
- Persistence (Redis/Postgres) and summarization/token budgeting.
"""

import asyncio
from dataclasses import dataclass
from typing import Dict, List, Literal, Optional

# Keep imports minimal; this module should be reusable from any service.

Role = Literal["user", "assistant"]

@dataclass(frozen=True)
class Message:
    role: Role
    content: str

# Safety limit to keep a single conversation bounded.
DEFAULT_MAX_MESSAGES_PER_CONVERSATION = 200


_lock = asyncio.Lock()
_history_by_conversation: Dict[str, List[Message]] = {}


async def append_message(
    *,
    conversation_id: str,
    role: Role,
    content: str,
    max_messages_per_conversation: int = DEFAULT_MAX_MESSAGES_PER_CONVERSATION,
) -> None:
    """
    Append a message to the in-memory history for `conversation_id`.

    This is intentionally transport-agnostic: callers decide what a "turn" means.
    """
    if not isinstance(conversation_id, str) or not conversation_id.strip():
        raise ValueError("conversation_id must be a non-empty string")
    if role not in ("user", "assistant"):
        raise ValueError("role must be 'user' or 'assistant'")
    if not isinstance(content, str):
        raise ValueError("content must be a string")

    normalized = content.strip()
    if not normalized:
        return

    msg = Message(role=role, content=normalized)

    async with _lock:
        history = _history_by_conversation.get(conversation_id)
        if history is None:
            history = []
            _history_by_conversation[conversation_id] = history

        history.append(msg)

        # Keep the most recent N messages (simple, fast, and enough for now).
        if max_messages_per_conversation <= 0:
            _history_by_conversation[conversation_id] = []
        elif len(history) > max_messages_per_conversation:
            _history_by_conversation[conversation_id] = history[-max_messages_per_conversation:]


async def get_history(*, conversation_id: str) -> List[Message]:
    """
    Return a copy of stored message history for `conversation_id`.
    """
    if not isinstance(conversation_id, str) or not conversation_id.strip():
        raise ValueError("conversation_id must be a non-empty string")

    async with _lock:
        history = _history_by_conversation.get(conversation_id, [])
        return list(history)


async def clear_history(*, conversation_id: str) -> None:
    """
    Clear stored message history for `conversation_id`.
    """
    if not isinstance(conversation_id, str) or not conversation_id.strip():
        raise ValueError("conversation_id must be a non-empty string")

    async with _lock:
        _history_by_conversation.pop(conversation_id, None)


async def build_anthropic_messages(
    *,
    conversation_id: str,
    tail_messages: Optional[int] = None,
) -> List[Dict[str, str]]:
    """
    Build an Anthropic-compatible `messages=[...]` list for `conversation_id`.

    Notes:
    - This returns only the stored chat history, not the `system` prompt.
    - If `tail_messages` is provided, only the most recent N messages are returned.
    """
    history = await get_history(conversation_id=conversation_id)
    if tail_messages is not None:
        if tail_messages <= 0:
            return []
        history = history[-tail_messages:]

    return [{"role": m.role, "content": m.content} for m in history]
