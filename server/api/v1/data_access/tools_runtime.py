"""
Tool definitions + execution runtime (data-access layer).

Why this module exists
----------------------
The Anthropic tool-use loop lives close to the provider integration, but it must
execute "tools" that ultimately hit the database.

To keep clean layering:
- data_access/* must NOT import from services/*
- services/* can import data_access/*

So tool definitions + dispatch are defined here, backed by
`api.v1.data_access.database.tools`.
"""

from __future__ import annotations

import json
import re
from typing import Any, Callable, Dict, List, Mapping, Optional

from .database import tools as db_tools


class ToolRuntimeError(RuntimeError):
    """Raised when tool dispatch/execution fails."""


def _to_loose_postgres_regex(query_text: str) -> str:
    """
    Convert freeform user text into a safe, loose Postgres regex.

    Example:
      "work gloves" -> ".*work.*gloves.*"
    """
    if not isinstance(query_text, str) or not query_text.strip():
        raise ToolRuntimeError("query_text must be a non-empty string")

    escaped = re.escape(query_text.strip())
    escaped = re.sub(r"\\\s+", ".*", escaped)
    return f".*{escaped}.*"


# ---------------------------------------------------------------------------
# Tool implementations (DB-backed)
# ---------------------------------------------------------------------------

def inventory_search(*, query_text: str, site_id: Optional[str] = None) -> List[Dict[str, Any]]:
    _ = site_id  # reserved for future multi-site support
    name_regex = _to_loose_postgres_regex(query_text)
    return db_tools.get_inventory_items_by_name_regex(name_regex=name_regex)


def product_price_search(*, query_text: str) -> List[Dict[str, Any]]:
    name_regex = _to_loose_postgres_regex(query_text)
    return db_tools.get_product_prices_by_name_regex(name_regex=name_regex)


def get_all_product_names() -> List[str]:
    return db_tools.get_all_product_names()


def get_product_prices_by_name_regex(*, name_regex: str) -> List[Dict[str, Any]]:
    if not isinstance(name_regex, str) or not name_regex.strip():
        raise ToolRuntimeError("name_regex must be a non-empty string")
    return db_tools.get_product_prices_by_name_regex(name_regex=name_regex.strip())


def get_inventory_items_by_name_regex(*, name_regex: str) -> List[Dict[str, Any]]:
    if not isinstance(name_regex, str) or not name_regex.strip():
        raise ToolRuntimeError("name_regex must be a non-empty string")
    return db_tools.get_inventory_items_by_name_regex(name_regex=name_regex.strip())


# ---------------------------------------------------------------------------
# Anthropic tool definitions + dispatch
# ---------------------------------------------------------------------------

TOOL_DEFINITIONS: List[Dict[str, Any]] = [
    {
        "name": "inventory_search",
        "description": "Search jobsite inventory for items matching a query string.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query_text": {
                    "type": "string",
                    "description": "What to search for, e.g. 'gloves' or 'Handschuh'.",
                },
                "site_id": {
                    "type": "string",
                    "description": "Optional site identifier (currently unused).",
                },
            },
            "required": ["query_text"],
        },
    },
    {
        "name": "product_price_search",
        "description": "Search the supplier price catalog for items matching a query string.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query_text": {
                    "type": "string",
                    "description": "What to search for, e.g. 'gloves' or 'Handschuh'.",
                }
            },
            "required": ["query_text"],
        },
    },
    {
        "name": "get_all_product_names",
        "description": "Retrieve all distinct product names (sorted).",
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "get_product_prices_by_name_regex",
        "description": "Retrieve products (with price and metadata) whose name matches a Postgres regex (~*, case-insensitive).",
        "input_schema": {
            "type": "object",
            "properties": {
                "name_regex": {
                    "type": "string",
                    "description": "Postgres regex pattern matched against artikelname using ~* (case-insensitive).",
                }
            },
            "required": ["name_regex"],
        },
    },
    {
        "name": "get_inventory_items_by_name_regex",
        "description": "Retrieve inventory items whose name matches a Postgres regex (~*, case-insensitive).",
        "input_schema": {
            "type": "object",
            "properties": {
                "name_regex": {
                    "type": "string",
                    "description": "Postgres regex pattern matched against artikelname using ~* (case-insensitive).",
                }
            },
            "required": ["name_regex"],
        },
    },
]


_TOOL_DISPATCH: Mapping[str, Callable[..., Any]] = {
    "inventory_search": inventory_search,
    "product_price_search": product_price_search,
    "get_all_product_names": get_all_product_names,
    "get_product_prices_by_name_regex": get_product_prices_by_name_regex,
    "get_inventory_items_by_name_regex": get_inventory_items_by_name_regex,
}


def execute_tool(*, name: str, tool_input: Optional[Dict[str, Any]] = None) -> Any:
    if not isinstance(name, str) or not name.strip():
        raise ToolRuntimeError("tool name must be a non-empty string")

    fn = _TOOL_DISPATCH.get(name)
    if fn is None:
        raise ToolRuntimeError(f"unknown_tool: {name}")

    kwargs: Dict[str, Any] = tool_input or {}
    if not isinstance(kwargs, dict):
        raise ToolRuntimeError("tool_input must be an object/dict")

    return fn(**kwargs)


def stringify_tool_result(result: Any) -> str:
    """
    Convert a tool's Python result into a stable string for Anthropic tool_result.
    Includes a size cap to avoid runaway prompt bloat.
    """
    if isinstance(result, str):
        text = result
    else:
        try:
            text = json.dumps(result, ensure_ascii=False, default=str)
        except Exception:
            text = str(result)

    max_chars = 12_000
    if len(text) > max_chars:
        text = text[:max_chars] + "\n…(truncated)…"
    return text

