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

from typing import Any, Dict, List, Optional

from ..data_access import tools_runtime as _rt


class ToolsServiceError(RuntimeError):
    """Backward-compatible alias for historical callers."""


# Re-export the canonical tool definitions used by Anthropic calls.
TOOL_DEFINITIONS = _rt.TOOL_DEFINITIONS


def execute_tool(*, name: str, tool_input: Optional[Dict[str, Any]] = None) -> Any:
    return _rt.execute_tool(name=name, tool_input=tool_input)


def stringify_tool_result(result: Any) -> str:
    return _rt.stringify_tool_result(result)


def get_all_product_names() -> List[str]:
    return _rt.get_all_product_names()


def get_product_prices_by_name_regex(*, name_regex: str) -> List[Dict[str, Any]]:
    return _rt.get_product_prices_by_name_regex(name_regex=name_regex)


def get_inventory_items_by_name_regex(*, name_regex: str) -> List[Dict[str, Any]]:
    return _rt.get_inventory_items_by_name_regex(name_regex=name_regex)


def inventory_search(*, query_text: str, site_id: Optional[str] = None) -> List[Dict[str, Any]]:
    return _rt.inventory_search(query_text=query_text, site_id=site_id)


def product_price_search(*, query_text: str) -> List[Dict[str, Any]]:
    return _rt.product_price_search(query_text=query_text)


