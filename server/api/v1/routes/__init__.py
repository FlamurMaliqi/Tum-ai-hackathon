from .artikel import router as artikel_router
from .inventory import router as inventory_router
from .elevenlabs_client_token import router as elevenlabs_client_token_router
from .websocket import router as ws_router
from .voice_processing import router as voice_processing_router

__all__ = ["artikel_router", "inventory_router", "elevenlabs_client_token_router", "ws_router", "voice_processing_router"]

