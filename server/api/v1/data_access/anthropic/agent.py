from __future__ import annotations
import asyncio
import logging
from typing import Any, Dict, List, Optional
from collections.abc import AsyncIterator

from .anthropic_config import MAX_TOKENS, MODEL, get_system_prompt
import anthropic

from ..tools_runtime import execute_tool, stringify_tool_result

logger = logging.getLogger(__name__)

# build the client
client = anthropic.Anthropic()

# Production timeouts (seconds)
PROVIDER_REQUEST_TIMEOUT_S = 45.0
TOOL_EXEC_TIMEOUT_S = 10.0
MAX_TOOL_ROUND_TRIPS = 10


async def _anthropic_create_in_thread(**kwargs: Any) -> Any:
    """
    Run the sync Anthropic SDK call off the event loop.
    """
    return await asyncio.wait_for(
        asyncio.to_thread(client.messages.create, **kwargs),
        timeout=PROVIDER_REQUEST_TIMEOUT_S,
    )


async def _execute_tool_in_thread(*, name: str, tool_input: Dict[str, Any]) -> Any:
    """
    Execute potentially-blocking tools (DB) off the event loop.
    """
    return await asyncio.wait_for(
        asyncio.to_thread(execute_tool, name=name, tool_input=tool_input),
        timeout=TOOL_EXEC_TIMEOUT_S,
    )


# Async function that streams the response from the anthropic agent
async def stream_anthropic_response(user_text: str, language: str = "en") -> AsyncIterator[str]:
    """
    Streams the response from the anthropic agent. DO NOT TOUCH THE EXISTING CODE.
    """
    system_prompt = get_system_prompt(language)
    with client.messages.stream(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        system=system_prompt,
        # TODO: add previous message fetching
        messages=[
            {"role": "user", "content": user_text},
            {"role": "assistant", "content": ""},
        ],
    ) as stream:
        for text in stream.text_stream:
            yield text

async def stream_anthropic_response_with_history(
    *, messages: list[dict[str, Any]], language: str = "en"
) -> AsyncIterator[str]:
    """
    Streams a response from Anthropic using a pre-built `messages=[...]` payload.

    Args:
        messages: Anthropic "messages" array, e.g. [{"role": "user", "content": "..."}]
        language: Language code ("en" or "de")
    """
    if not isinstance(messages, list):
        raise TypeError("messages must be a list")

    system_prompt = get_system_prompt(language)
    with client.messages.stream(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        system=system_prompt,
        messages=messages,
    ) as stream:
        for text in stream.text_stream:
            yield text

async def stream_anthropic_response_with_history_and_tools(
    *, messages: list[dict[str, Any]], tools: list[dict[str, Any]], language: str = "en"
) -> AsyncIterator[str]:
    """
    Streams a response from Anthropic using a pre-built `messages=[...]` payload and tools.

    This function implements the **tool-use loop**:
    - Ask Claude for the next assistant message (with tools available)
    - If Claude requests tool(s), execute them server-side
    - Send tool_result blocks back to Claude
    - Repeat until Claude returns a normal text response

    Args:
        messages: Anthropic "messages" array, e.g. [{"role": "user", "content": "..."}]
        tools: List of tools to use, e.g. [{"type": "function", "function": {"name": "get_product_prices", "description": "Get the prices of a product", "parameters": {"type": "object", "properties": {"name": {"type": "string", "description": "The name of the product"}}}}}]
        language: Language code ("en" or "de")
    """
    if not isinstance(messages, list):
        raise TypeError("messages must be a list")

    if not isinstance(tools, list):
        raise TypeError("tools must be a list")
    
    system_prompt = get_system_prompt(language)

    # Defensive: older callers used to append {"role":"assistant","content":""}.
    # That pattern breaks tool-calling (we want Claude to produce the assistant turn).
    messages_for_model: List[Dict[str, Any]] = list(messages)
    if (
        messages_for_model
        and messages_for_model[-1].get("role") == "assistant"
        and (messages_for_model[-1].get("content") == "" or messages_for_model[-1].get("content") == [])
    ):
        messages_for_model.pop()

    def _block_to_dict(block: Any) -> Dict[str, Any]:
        if isinstance(block, dict):
            return dict(block)
        if hasattr(block, "model_dump"):
            return block.model_dump()  # type: ignore[no-any-return]
        if hasattr(block, "to_dict"):
            return block.to_dict()  # type: ignore[no-any-return]

        btype = getattr(block, "type", None)
        if btype == "text":
            return {"type": "text", "text": getattr(block, "text", "")}
        if btype == "tool_use":
            return {
                "type": "tool_use",
                "id": getattr(block, "id", ""),
                "name": getattr(block, "name", ""),
                "input": getattr(block, "input", {}) or {},
            }
        # Fallback best-effort
        return {"type": str(btype) if btype is not None else "unknown", "raw": str(block)}

    def _extract_text_blocks(content_blocks: List[Dict[str, Any]]) -> List[str]:
        return [b.get("text", "") for b in content_blocks if b.get("type") == "text" and isinstance(b.get("text"), str)]

    def _extract_tool_uses(content_blocks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        tool_uses: List[Dict[str, Any]] = []
        for b in content_blocks:
            if b.get("type") != "tool_use":
                continue
            tool_uses.append(
                {
                    "id": b.get("id"),
                    "name": b.get("name"),
                    "input": b.get("input") if isinstance(b.get("input"), dict) else {},
                }
            )
        return tool_uses

    for _ in range(MAX_TOOL_ROUND_TRIPS):
        # Note: using create() (non-stream) so we can reliably handle tool_use.
        resp = await _anthropic_create_in_thread(
            model=MODEL,
            max_tokens=MAX_TOKENS,
            system=system_prompt,
            messages=messages_for_model,
            tools=tools,
        )

        # Normalize content blocks to plain dicts.
        raw_content = getattr(resp, "content", [])  # sdk Message.content
        content_blocks: List[Dict[str, Any]] = [_block_to_dict(b) for b in (raw_content or [])]

        # Stream any text Claude produced in this step (even if it also requested tools).
        for text in _extract_text_blocks(content_blocks):
            if text:
                yield text

        tool_uses = _extract_tool_uses(content_blocks)
        if not tool_uses:
            return

        # Append Claude's tool request message to the running conversation we send back.
        messages_for_model.append({"role": "assistant", "content": content_blocks})

        # Execute requested tools and return tool_result blocks.
        tool_results: List[Dict[str, Any]] = []
        for tu in tool_uses:
            tool_use_id = tu.get("id")
            name = tu.get("name")
            tool_input = tu.get("input")

            if not isinstance(tool_use_id, str) or not tool_use_id:
                continue
            if not isinstance(name, str) or not name:
                tool_results.append(
                    {
                        "type": "tool_result",
                        "tool_use_id": tool_use_id,
                        "is_error": True,
                        "content": "Tool call missing name",
                    }
                )
                continue

            try:
                result = await _execute_tool_in_thread(
                    name=name,
                    tool_input=tool_input if isinstance(tool_input, dict) else {},
                )
                tool_results.append(
                    {
                        "type": "tool_result",
                        "tool_use_id": tool_use_id,
                        "content": stringify_tool_result(result),
                    }
                )
            except Exception as e:
                logger.exception("Tool execution failed: %s", name)
                tool_results.append(
                    {
                        "type": "tool_result",
                        "tool_use_id": tool_use_id,
                        "is_error": True,
                        "content": f"{type(e).__name__}: {e}",
                    }
                )

        messages_for_model.append({"role": "user", "content": tool_results})

    # If we hit the max tool round-trips, return a graceful fallback.
    yield "\n\nI’m having trouble completing the tool checks right now. Please try again."
