from .artikel import router as artikel_router
from .inventory import router as inventory_router
from .websocket import router as ws_router

__all__ = ["artikel_router", "inventory_router", "ws_router"]

