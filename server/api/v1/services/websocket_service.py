import asyncio
import json
import logging
from typing import Any, Optional

from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)


async def handle_websocket(ws: WebSocket) -> None:
    """
    WebSocket session handler (service layer).

    Keep this logic out of routing so we can extend it later (token/audio streaming,
    auth, rooms, etc.) without refactoring the API surface.

    - Bidirectional messaging (JSON text frames)
    - Streaming responses (token frames emitted over time)
    - Binary frames (placeholder for future audio streaming)
    """
    await ws.accept()

    stream_task: Optional[asyncio.Task[None]] = None

    async def _cancel_stream(reason: str = "interrupt") -> None:
        nonlocal stream_task
        if stream_task is None or stream_task.done():
            stream_task = None
            return
        stream_task.cancel()
        try:
            await stream_task
        except asyncio.CancelledError:
            pass
        finally:
            stream_task = None
            # Let the client know the current stream was stopped.
            try:
                await ws.send_json({"type": "stream_cancelled", "reason": reason})
            except Exception:
                # If we're already disconnected/closing, ignore.
                pass

    async def _stream_assistant_response(user_text: str) -> None:
        """
        Token streaming scaffold. Replace this with your AI/token generator later
        without changing the message envelope.
        """
        await ws.send_json({"type": "assistant_start"})

        # Placeholder "tokenization" so the client sees real-time streaming.
        tokens = (user_text or "").strip().split() or ["(empty)"]
        for tok in tokens:
            await ws.send_json({"type": "assistant_token", "text": tok + " "})
            await asyncio.sleep(0.08)

        await ws.send_json({"type": "assistant_done"})

        # Placeholder binary payload (future: raw audio bytes).
        await ws.send_bytes(b"\x00\x01\x02\x03audio_placeholder")

    try:
        await ws.send_json({"type": "server_hello", "message": "connected"})

        while True:
            frame: dict[str, Any] = await ws.receive()
            frame_type = frame.get("type")

            if frame_type == "websocket.disconnect":
                break

            # Browser clients will send JSON in text frames.
            text = frame.get("text")
            if text is not None:
                try:
                    msg = json.loads(text)
                except json.JSONDecodeError:
                    await ws.send_json({"type": "error", "message": "invalid_json"})
                    continue

                msg_type = msg.get("type")
                if msg_type == "user_message":
                    user_text = msg.get("text")
                    if not isinstance(user_text, str):
                        await ws.send_json(
                            {"type": "error", "message": "user_message.text must be a string"}
                        )
                        continue

                    # Server-side proof that we received the text.
                    try:
                        client = f"{ws.client.host}:{ws.client.port}" if ws.client else "unknown"
                    except Exception:
                        client = "unknown"
                    logger.info("ws user_message from %s: %s", client, user_text)

                    # If a stream is in progress, cancel it and start a new one.
                    await _cancel_stream(reason="new_user_message")
                    await ws.send_json({"type": "server_message", "text": f"ack: {user_text}"})
                    stream_task = asyncio.create_task(_stream_assistant_response(user_text))
                    continue

                if msg_type == "interrupt":
                    await _cancel_stream(reason="interrupt")
                    await ws.send_json({"type": "server_message", "text": "interrupted"})
                    continue

                await ws.send_json({"type": "error", "message": "unknown_type"})
                continue

            # Binary frames are accepted (future: audio input). For now, just log size.
            data = frame.get("bytes")
            if data is not None:
                await ws.send_json({"type": "binary_received", "bytes": len(data)})
                continue

            await ws.send_json({"type": "error", "message": "unsupported_frame"})

    except WebSocketDisconnect:
        # Client disconnected normally.
        pass
    except Exception:
        logger.exception("WebSocket session error")
        try:
            await ws.close(code=1011)
        except Exception:
            pass
    finally:
        # Ensure background stream is stopped.
        try:
            await _cancel_stream(reason="disconnect")
        except Exception:
            pass


