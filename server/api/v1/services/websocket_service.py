"""
WebSocket service layer.

This module owns the per-connection lifecycle and message protocol for
`/api/v1/websocket/`.

Protocol (JSON text frames)
---------------------------
Client → server:
- {"type": "user_message", "text": "<string>"}  # contributes to current "turn"
- {"type": "end_turn"}                         # optional explicit turn boundary
- {"type": "interrupt"}                        # cancels streaming + clears turn buffer

Server → client:
- {"type": "server_hello", ...}
- {"type": "server_message", ...}              # acks / informational
- {"type": "turn_complete", "trigger": "..."}  # emitted once per flushed turn
- {"type": "assistant_start"}
- {"type": "assistant_token", "text": "..."}   # streamed chunks
- {"type": "assistant_done"}
- {"type": "stream_cancelled", "reason": "..."}
- {"type": "assistant_error", "message": "..."}

Binary frames
-------------
Binary frames are accepted and acknowledged (placeholder for future audio input).
"""

import asyncio
import json
import logging
import uuid
from typing import Any, Optional

from fastapi import WebSocket, WebSocketDisconnect

from .claude_service import ClaudeServiceError, stream_claude_reply
from .message_history_service import append_message
from .tts_service import stream_tts

logger = logging.getLogger(__name__)

# "Turn" heuristic: consider a turn complete after the client has been idle for
# this many seconds. This matches the current demo which sends ~1 message/sec.
TURN_IDLE_SECONDS = 1.25

# Safety limits to keep a single connection from growing unbounded state.
# These should be tuned based on your expected client behavior.
MAX_TURN_MESSAGES = 100
MAX_TURN_CHARS = 50_000


async def handle_websocket(ws: WebSocket) -> None:
    """
    WebSocket session handler (service layer).

    Keep this logic out of routing so we can extend it later (token/audio streaming,
    auth, rooms, etc.) without refactoring the API surface.

    - Bidirectional messaging (JSON text frames)
    - Streaming responses (token frames emitted over time)
    - Binary frames (placeholder for future audio streaming)
    """
    # Accept immediately so the client can start sending frames.
    await ws.accept()

    # A single websocket session maps to a single in-memory "conversation".
    conversation_id = ws.query_params.get("conversation_id") or uuid.uuid4().hex

    # Background task that streams the assistant response to the client.
    stream_task: Optional[asyncio.Task[None]] = None

    # Background task that waits for user idle and then flushes the turn buffer.
    turn_task: Optional[asyncio.Task[None]] = None

    # Accumulated user messages for the current "turn" (the unit sent to Claude).
    turn_buffer: list[str] = []

    # Guards `turn_buffer` since both the receive loop and the idle timer can touch it.
    turn_lock = asyncio.Lock()

    async def _cancel_stream(reason: str = "interrupt") -> None:
        """
        Cancel any in-flight assistant streaming task.

        This is used when:
        - the client sends `interrupt`
        - a new turn starts while an old stream is still running
        - the socket is closing
        """
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
        Stream Claude tokens using the existing message envelope.

        This function is intentionally small and "transport-focused":
        it does not own turn-buffering, state, or cancellation policy—only
        sending the stream events over this WebSocket.
        """
        await ws.send_json({"type": "assistant_start"})

        assistant_text_parts: list[str] = []
        try:
            # `stream_claude_reply()` yields text chunks as they arrive.
            async def claude_text_stream():
                async for text in stream_claude_reply(
                    user_text=user_text, conversation_id=conversation_id
                ):
                    if text:
                        assistant_text_parts.append(text)
                        await ws.send_json({"type": "assistant_token", "text": text})
                        # IMPORTANT: `stream_tts()` expects an async iterator.
                        # Yield each chunk so ElevenLabs can synthesize streaming audio.
                        yield text

            async for audio_chunk in stream_tts(claude_text_stream()):
                await ws.send_bytes(audio_chunk)
        except asyncio.CancelledError:
            # Important: re-raise so upstream cancellation is respected.
            raise
        except ClaudeServiceError:
            # Provider errors are already logged in the service layer.
            await ws.send_json({"type": "assistant_error", "message": "anthropic_stream_error"})
        except Exception:
            # Never let model/provider failures crash the WS handler loop.
            logger.exception("Anthropic stream error")
            await ws.send_json({"type": "assistant_error", "message": "anthropic_stream_error"})
        else:
            await ws.send_json({"type": "assistant_done"})
            assistant_text = "".join(assistant_text_parts).strip()
            if assistant_text:
                # Persist the assistant message for future turns in this session.
                await append_message(
                    conversation_id=conversation_id, role="assistant", content=assistant_text
                )

    async def _cancel_turn_timer() -> None:
        """
        Cancel the idle timer (if any).

        We restart this timer on every `user_message`. When it fires, it flushes
        the current turn.
        """
        nonlocal turn_task
        if turn_task is None or turn_task.done():
            turn_task = None
            return
        turn_task.cancel()
        try:
            await turn_task
        except asyncio.CancelledError:
            pass
        finally:
            turn_task = None

    async def _flush_turn(trigger: str) -> None:
        """
        Treat the current accumulated client messages as a single "turn" and
        start streaming an assistant response for the full text.

        `trigger` records why we flushed (idle timeout vs explicit end_turn vs limits).
        """
        nonlocal stream_task
        async with turn_lock:
            full_text = "\n".join([t for t in turn_buffer if isinstance(t, str)]).strip()
            turn_buffer.clear()
        if not full_text:
            return

        # Persist the user's turn as a single message (turn buffering is WS-owned).
        await append_message(conversation_id=conversation_id, role="user", content=full_text)

        # Useful for clients (UI state machines) and for debugging.
        await ws.send_json({"type": "turn_complete", "trigger": trigger})

        # If a stream is in progress, cancel it and start a new one.
        await _cancel_stream(reason="new_turn")
        stream_task = asyncio.create_task(_stream_assistant_response(full_text))

    async def _schedule_turn_flush() -> None:
        """
        (Re)schedule a turn flush after the client has been idle long enough.
        """
        nonlocal turn_task
        await _cancel_turn_timer()

        async def _idle_then_flush() -> None:
            """
            Wait for client silence; if no new `user_message` arrives, flush.

            This is the current definition of "turn complete" for streaming/voice-like
            clients that send partial chunks over time.
            """
            await asyncio.sleep(TURN_IDLE_SECONDS)
            await _flush_turn(trigger="idle_timeout")

        turn_task = asyncio.create_task(_idle_then_flush())

    async def _append_to_turn(user_text: str) -> bool:
        """
        Append a message to the current turn buffer with safety limits.

        Returns:
        - True if appended successfully
        - False if the input was rejected (e.g. too large)
        """
        # Normalize/defend against extremely large payloads early.
        user_text = user_text.strip()
        if not user_text:
            return True

        async with turn_lock:
            if len(turn_buffer) >= MAX_TURN_MESSAGES:
                # Flushing happens outside the lock; just signal the caller.
                return False

            projected_chars = sum(len(t) for t in turn_buffer) + len(user_text)
            if projected_chars > MAX_TURN_CHARS:
                return False

            turn_buffer.append(user_text)
            return True

    try:
        await ws.send_json(
            {"type": "server_hello", "message": "connected", "conversation_id": conversation_id}
        )

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

                    # If a stream is in progress, cancel it (we're starting a new turn).
                    await _cancel_stream(reason="new_user_message")

                    # Accumulate this message into the current "turn" buffer.
                    ok = await _append_to_turn(user_text)
                    if not ok:
                        # Turn is getting too large; flush what we have and start a new turn.
                        # (We do not automatically include this overflowing message.)
                        await ws.send_json({"type": "error", "message": "turn_too_large"})
                        await _cancel_turn_timer()
                        await _flush_turn(trigger="limits")
                        continue

                    await _schedule_turn_flush()
                    await ws.send_json({"type": "server_message", "text": f"ack: {user_text}"})
                    continue

                if msg_type == "end_turn":
                    # Client-driven boundary (useful for push-to-talk or explicit UI actions).
                    await _cancel_turn_timer()
                    await _flush_turn(trigger="explicit_end_turn")
                    continue

                if msg_type == "interrupt":
                    # Cancel everything related to the current interaction.
                    await _cancel_stream(reason="interrupt")
                    await _cancel_turn_timer()
                    async with turn_lock:
                        turn_buffer.clear()
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
        try:
            await _cancel_turn_timer()
        except Exception:
            pass


