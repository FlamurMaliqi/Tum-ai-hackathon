from fastapi import APIRouter, WebSocket

from ..services.websocket_service import handle_websocket


router = APIRouter(prefix="/websocket", tags=["websocket"])


@router.websocket("/")
async def websocket_endpoint(ws: WebSocket) -> None:
    """Thin route wrapper; all session logic lives in the service layer."""
    await handle_websocket(ws)


