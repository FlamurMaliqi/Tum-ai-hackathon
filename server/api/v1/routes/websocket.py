from fastapi import APIRouter, WebSocket

from ..services.websocket_service import handle_websocket

# No prefix on purpose: endpoint must be exactly "/websocket" (not versioned),
# while still living in the existing routes/ structure.
router = APIRouter(tags=["websocket"])


@router.websocket("/websocket")
async def websocket_endpoint(ws: WebSocket) -> None:
    """Thin route wrapper; all session logic lives in the service layer."""
    await handle_websocket(ws)


