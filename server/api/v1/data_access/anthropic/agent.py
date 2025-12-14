from __future__ import annotations
from typing import Any
from collections.abc import AsyncIterator

from ..database import tools
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

async def stream_anthropic_response_with_history_and_tools(
    *, messages: list[dict[str, Any]], tools: list[dict[str, Any]]
) -> AsyncIterator[str]:
    """
    Streams a response from Anthropic using a pre-built `messages=[...]` payload and tools.

    Args:
        messages: Anthropic "messages" array, e.g. [{"role": "user", "content": "..."}]
        tools: List of tools to use, e.g. [{"type": "function", "function": {"name": "get_product_prices", "description": "Get the prices of a product", "parameters": {"type": "object", "properties": {"name": {"type": "string", "description": "The name of the product"}}}}}]
    """
    if not isinstance(messages, list):
        raise TypeError("messages must be a list")

    if not isinstance(tools, list):
        raise TypeError("tools must be a list")

    with client.messages.stream(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        system=SYSTEM_PROMPT,
        messages=messages,
        tools=tools,
    ) as stream:
        for text in stream.text_stream:
            yield text
