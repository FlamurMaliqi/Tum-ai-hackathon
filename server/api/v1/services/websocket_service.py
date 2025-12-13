"""
WebSocket Voice Assistant Service

Flow: User text → Claude (streaming) → ElevenLabs TTS → Audio to client
"""
import asyncio
import json
import logging
from typing import Any, Optional

from fastapi import WebSocket, WebSocketDisconnect

from .tts_service import stream_tts

logger = logging.getLogger(__name__)


# =============================================================================
# 🔧 TEAMMATE: REPLACE THIS FUNCTION WITH YOUR CLAUDE SERVICE
# =============================================================================
#
# Requirements:
#   - Must be an async generator (use 'async def' and 'yield')
#   - Yield text chunks as strings (e.g., "Hello ", "world!")
#   - Each chunk gets sent to ElevenLabs for speech synthesis
#
# Example integration:
#
#   from .your_claude_service import stream_claude_response
#
#   async def get_ai_response(user_text: str):
#       async for chunk in stream_claude_response(user_text):
#           yield chunk
#
# =============================================================================
async def get_ai_response(user_text: str):
    """
    MOCK: Just echoes the input text back.
    Replace this with your Claude streaming service.
    """
    for word in user_text.split():
        yield word + " "
        await asyncio.sleep(0.05)
# =============================================================================


async def handle_websocket(ws: WebSocket) -> None:
    """
    Main WebSocket handler.
    
    Client sends:    {"type": "user_message", "text": "Hello"}
    Server sends:    {"type": "assistant_token", "text": "Hi "}  (text chunks)
                     <binary audio chunks>
                     {"type": "assistant_done", "full_text": "Hi there!"}
    """
    await ws.accept()
    stream_task: Optional[asyncio.Task] = None

    async def cancel_stream():
        nonlocal stream_task
        if stream_task and not stream_task.done():
            stream_task.cancel()
            try:
                await stream_task
            except asyncio.CancelledError:
                pass
        stream_task = None

    async def process_message(user_text: str) -> None:
        """Pipeline: AI text stream → TTS → audio to client."""
        await ws.send_json({"type": "assistant_start"})
        full_text = ""
        
        try:
            async def text_stream():
                nonlocal full_text
                async for chunk in get_ai_response(user_text):
                    full_text += chunk
                    await ws.send_json({"type": "assistant_token", "text": chunk})
                    yield chunk
            
            async for audio_chunk in stream_tts(text_stream()):
                await ws.send_bytes(audio_chunk)
                
        except Exception as e:
            logger.exception("Stream error")
            await ws.send_json({"type": "error", "message": str(e)})
        
        await ws.send_json({"type": "assistant_done", "full_text": full_text})

    # Main message loop
    try:
        await ws.send_json({"type": "server_hello"})

        while True:
            frame: dict[str, Any] = await ws.receive()
            
            if frame.get("type") == "websocket.disconnect":
                break

            text = frame.get("text")
            if not text:
                continue
                
            try:
                msg = json.loads(text)
            except json.JSONDecodeError:
                await ws.send_json({"type": "error", "message": "invalid_json"})
                continue

            msg_type = msg.get("type")
            
            if msg_type == "user_message":
                user_text = msg.get("text", "")
                if user_text:
                    await cancel_stream()
                    stream_task = asyncio.create_task(process_message(user_text))
            
            elif msg_type == "interrupt":
                await cancel_stream()
                await ws.send_json({"type": "interrupted"})

    except WebSocketDisconnect:
        pass
    except Exception:
        logger.exception("WebSocket error")
    finally:
        await cancel_stream()
