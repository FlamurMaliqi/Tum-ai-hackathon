from __future__ import annotations

"""
Tool service layer.

This module defines *service-layer wrappers* for DB query "tools" implemented in
`api.v1.data_access.database.tools`. Callers should depend on this service
contract rather than importing the DB layer directly.

Non-responsibilities:
- Wiring these tools into Anthropic/Cursor tool-calling (done elsewhere).
- Defining/owning DB queries (owned by data-access layer).
"""

from typing import Any, Callable, Dict, List, Mapping, Optional

from ..data_access.database import tools as db_tools


class ToolsServiceError(RuntimeError):
    """Raised when a tool wrapper cannot complete successfully."""


# ---------------------------------------------------------------------------
# Individual tool wrappers (one per DB function)
# ---------------------------------------------------------------------------

def get_all_product_names() -> List[str]:
    """
    Tool: Return all distinct product names from the price table.

    This is a thin wrapper around `data_access.database.tools.get_all_product_names`.
    """
    try:
        return db_tools.get_all_product_names()
    except Exception as e:
        raise ToolsServiceError("get_all_product_names_failed") from e


def get_product_prices_by_name_regex(*, name_regex: str) -> List[Dict[str, Any]]:
    """
    Tool: Return products + prices whose name matches a Postgres regex (case-insensitive).

    Args:
        name_regex: Postgres regex pattern used with `~*`.
    """
    if not isinstance(name_regex, str) or not name_regex.strip():
        raise ToolsServiceError("name_regex must be a non-empty string")
    try:
        return db_tools.get_product_prices_by_name_regex(name_regex=name_regex.strip())
    except Exception as e:
        raise ToolsServiceError("get_product_prices_by_name_regex_failed") from e


def get_inventory_items_by_name_regex(*, name_regex: str) -> List[Dict[str, Any]]:
    """
    Tool: Return inventory items whose name matches a Postgres regex (case-insensitive).

    Args:
        name_regex: Postgres regex pattern used with `~*`.
    """
    if not isinstance(name_regex, str) or not name_regex.strip():
        raise ToolsServiceError("name_regex must be a non-empty string")
    try:
        return db_tools.get_inventory_items_by_name_regex(name_regex=name_regex.strip())
    except Exception as e:
        raise ToolsServiceError("get_inventory_items_by_name_regex_failed") from e


# ---------------------------------------------------------------------------
# Tool metadata + local dispatch helpers (NOT wired to any transport/provider)
# ---------------------------------------------------------------------------

# Anthropic-style tool definition objects. These are intentionally simple and can be
# adapted by the eventual caller (HTTP/WebSocket/agent layer).
TOOL_DEFINITIONS: List[Dict[str, Any]] = [
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

