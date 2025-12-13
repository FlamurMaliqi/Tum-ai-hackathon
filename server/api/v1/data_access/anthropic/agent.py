from __future__ import annotations
from typing import Any
from collections.abc import AsyncIterator
from .anthropic_config import MAX_TOKENS, MODEL, SYSTEM_PROMPT
import anthropic


# build the client
client = anthropic.Anthropic()


# Async function that streams the response from the anthropic agent
async def stream_anthropic_response(user_text: str) -> AsyncIterator[str]:
    """
    Streams the response from the anthropic agent. DO NOT TOUCH THE EXISTING CODE.
    """
    with client.messages.stream(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        system=SYSTEM_PROMPT,
        # TODO: add previous message fetching
        messages=[
            {"role": "user", "content": user_text},
            {"role": "assistant", "content": ""},
        ],
    ) as stream:
        for text in stream.text_stream:
            yield text

async def stream_anthropic_response_with_history(
    *, messages: list[dict[str, Any]]
) -> AsyncIterator[str]:
    """
    Streams a response from Anthropic using a pre-built `messages=[...]` payload.

    Args:
        messages: Anthropic "messages" array, e.g. [{"role": "user", "content": "..."}]
    """
    if not isinstance(messages, list):
        raise TypeError("messages must be a list")

    with client.messages.stream(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        system=SYSTEM_PROMPT,
        messages=messages,
    ) as stream:
        for text in stream.text_stream:
            yield text
