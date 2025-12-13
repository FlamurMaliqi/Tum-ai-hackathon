import os

from fastapi import APIRouter, WebSocket, HTTPException, status

from ..services.scribe_service import handle_scribe_websocket


router = APIRouter(prefix="/scribe", tags=["scribe"])


@router.websocket("/ws")
async def scribe_websocket_endpoint(
    websocket: WebSocket,
    language_code: str = None,
    include_timestamps: bool = False,
) -> None:
    """
    WebSocket endpoint for ElevenLabs Realtime Speech-to-Text (Scribe).
    
    This endpoint creates a bidirectional streaming connection:
    - Client sends audio chunks in base64-encoded PCM format
    - Server forwards to ElevenLabs Scribe API
    - Transcripts are streamed back to client in real-time
    
    Query Parameters:
        language_code: Optional ISO language code (e.g., "en", "de")
        include_timestamps: Whether to include word-level timestamps (default: False)
    
    Client Message Format:
        {
            "type": "audio_chunk",
            "audio_base64": "<base64-encoded-pcm-audio>",
            "sample_rate": 16000
        }
        
        {
            "type": "commit"  // Commit current segment
        }
        
        {
            "type": "stop"  // Stop transcription
        }
    
    Server Message Format (from ElevenLabs):
        {
            "type": "session_started",
            "data": {...}
        }
        
        {
            "type": "partial_transcript",
            "data": {"text": "..."}
        }
        
        {
            "type": "committed_transcript",
            "data": {"text": "..."}
        }
    """
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        await websocket.close(code=1008, reason="ELEVENLABS_API_KEY not configured")
        return
    
    await handle_scribe_websocket(
        ws=websocket,
        elevenlabs_api_key=api_key,
        model_id="scribe_v2_realtime",
        language_code=language_code,
        audio_format="pcm_16000",
        sample_rate=16000,
        include_timestamps=include_timestamps,
    )
