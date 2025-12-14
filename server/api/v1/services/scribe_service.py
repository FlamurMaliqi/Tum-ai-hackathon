import asyncio
import json
import logging
from typing import Any, Callable, Optional

import websockets
from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)


class ScribeSession:
    """
    Manages a bidirectional WebSocket session that bridges:
    - Client (browser) <-> Backend (FastAPI) <-> ElevenLabs Scribe API
    
    Flow:
    1. Client connects to FastAPI WebSocket
    2. Backend connects to ElevenLabs Scribe WebSocket with API key
    3. Audio from client is forwarded to ElevenLabs
    4. Transcripts from ElevenLabs are forwarded to client
    """

    def __init__(
        self,
        client_ws: WebSocket,
        elevenlabs_api_key: str,
        model_id: str = "scribe_v2_realtime",
        language_code: Optional[str] = None,
        audio_format: str = "pcm_16000",
        sample_rate: int = 16000,
        include_timestamps: bool = False,
    ):
        self.client_ws = client_ws
        self.elevenlabs_api_key = elevenlabs_api_key
        self.model_id = model_id
        self.language_code = language_code
        self.audio_format = audio_format
        self.sample_rate = sample_rate
        self.include_timestamps = include_timestamps
        self.elevenlabs_ws: Optional[websockets.WebSocketClientProtocol] = None
        self._running = False

    async def connect_to_elevenlabs(self) -> None:
        """Establish WebSocket connection to ElevenLabs Scribe API."""
        # Build WebSocket URL with query parameters
        url = f"wss://api.elevenlabs.io/v1/speech-to-text/realtime?model_id={self.model_id}"
        
        if self.language_code:
            url += f"&language_code={self.language_code}"
        
        url += f"&audio_format={self.audio_format}"
        url += f"&include_timestamps={'true' if self.include_timestamps else 'false'}"

        headers = {"xi-api-key": self.elevenlabs_api_key}

        try:
            self.elevenlabs_ws = await websockets.connect(url, additional_headers=headers)
            logger.info("Connected to ElevenLabs Scribe API")
        except Exception as e:
            logger.error(f"Failed to connect to ElevenLabs: {e}")
            raise

    async def forward_client_to_elevenlabs(self) -> None:
        """
        Receive messages from client and forward audio chunks to ElevenLabs.
        Expected client message format:
        {
            "type": "audio_chunk",
            "audio_base64": "<base64-encoded-audio>",
            "sample_rate": 16000
        }
        """
        try:
            while self._running:
                try:
                    # Receive from client
                    data = await asyncio.wait_for(self.client_ws.receive_text(), timeout=30.0)
                    message = json.loads(data)
                    
                    msg_type = message.get("type")
                    
                    if msg_type == "audio_chunk":
                        # Forward audio chunk to ElevenLabs
                        audio_base64 = message.get("audio_base64", "")
                        sample_rate = message.get("sample_rate", self.sample_rate)
                        
                        elevenlabs_payload = {
                            "message_type": "input_audio_chunk",
                            "audio_base_64": audio_base64,
                            "commit": False,
                            "sample_rate": sample_rate,
                        }
                        
                        # Add previous_text context if provided (for first chunk)
                        previous_text = message.get("previous_text")
                        if previous_text:
                            elevenlabs_payload["previous_text"] = previous_text
                        
                        if self.elevenlabs_ws:
                            await self.elevenlabs_ws.send(json.dumps(elevenlabs_payload))
                    
                    elif msg_type == "commit":
                        # Commit current segment
                        if self.elevenlabs_ws:
                            commit_payload = {
                                "message_type": "input_audio_chunk",
                                "audio_base_64": "",
                                "commit": True,
                                "sample_rate": self.sample_rate,
                            }
                            await self.elevenlabs_ws.send(json.dumps(commit_payload))
                    
                    elif msg_type == "stop":
                        # Client requested to stop
                        self._running = False
                        break
                
                except asyncio.TimeoutError:
                    # Keep connection alive
                    continue
                except json.JSONDecodeError:
                    logger.warning("Invalid JSON from client")
                    await self.client_ws.send_json({
                        "type": "error",
                        "message": "Invalid JSON format"
                    })
                except Exception as e:
                    logger.error(f"Error forwarding to ElevenLabs: {e}")
                    break
        
        except WebSocketDisconnect:
            logger.info("Client disconnected")
        except Exception as e:
            logger.error(f"Error in client->ElevenLabs pipeline: {e}")
        finally:
            self._running = False

    async def forward_elevenlabs_to_client(self) -> None:
        """
        Receive transcript messages from ElevenLabs and forward to client.
        ElevenLabs message types:
        - session_started
        - partial_transcript
        - committed_transcript
        - committed_transcript_with_timestamps
        - input_error, auth_error, etc.
        """
        try:
            while self._running and self.elevenlabs_ws:
                try:
                    message_str = await asyncio.wait_for(
                        self.elevenlabs_ws.recv(), timeout=30.0
                    )
                    message = json.loads(message_str)
                    
                    msg_type = message.get("message_type")
                    
                    # Forward to client with consistent format
                    client_message = {
                        "type": msg_type,
                        "data": message
                    }
                    
                    await self.client_ws.send_json(client_message)
                    
                    # Log important events
                    if msg_type == "session_started":
                        logger.info("ElevenLabs session started")
                    elif msg_type in ["partial_transcript", "committed_transcript"]:
                        text = message.get("text", "")
                        logger.debug(f"{msg_type}: {text}")
                    elif msg_type in ["auth_error", "quota_exceeded", "input_error", "error"]:
                        logger.error(f"ElevenLabs error: {message}")
                        self._running = False
                
                except asyncio.TimeoutError:
                    continue
                except json.JSONDecodeError:
                    logger.warning("Invalid JSON from ElevenLabs")
                except Exception as e:
                    logger.error(f"Error receiving from ElevenLabs: {e}")
                    break
        
        except Exception as e:
            logger.error(f"Error in ElevenLabs->client pipeline: {e}")
        finally:
            self._running = False

    async def start(self) -> None:
        """Start the bidirectional streaming session."""
        try:
            # Accept client connection
            await self.client_ws.accept()
            
            # Connect to ElevenLabs
            await self.connect_to_elevenlabs()
            
            # Start bidirectional forwarding
            self._running = True
            
            # Run both forwarding tasks concurrently
            await asyncio.gather(
                self.forward_client_to_elevenlabs(),
                self.forward_elevenlabs_to_client(),
                return_exceptions=True
            )
        
        except Exception as e:
            logger.error(f"Error in scribe session: {e}")
            try:
                await self.client_ws.send_json({
                    "type": "error",
                    "message": str(e)
                })
            except Exception:
                pass
        
        finally:
            await self.cleanup()

    async def cleanup(self) -> None:
        """Clean up connections."""
        self._running = False
        
        # Close ElevenLabs connection
        if self.elevenlabs_ws:
            try:
                await self.elevenlabs_ws.close()
                logger.info("Closed ElevenLabs connection")
            except Exception as e:
                logger.error(f"Error closing ElevenLabs connection: {e}")
        
        # Close client connection
        try:
            await self.client_ws.close()
            logger.info("Closed client connection")
        except Exception:
            pass


async def handle_scribe_websocket(
    ws: WebSocket,
    elevenlabs_api_key: str,
    model_id: str = "scribe_v2_realtime",
    language_code: Optional[str] = None,
    audio_format: str = "pcm_16000",
    sample_rate: int = 16000,
    include_timestamps: bool = False,
) -> None:
    """
    Main entry point for handling a Scribe WebSocket session.
    
    Args:
        ws: FastAPI WebSocket connection
        elevenlabs_api_key: ElevenLabs API key
        model_id: Scribe model to use (default: scribe_v2_realtime)
        language_code: Optional ISO language code (e.g., "en", "de")
        audio_format: Audio format (default: pcm_16000)
        sample_rate: Sample rate in Hz (default: 16000)
        include_timestamps: Whether to include word-level timestamps
    """
    session = ScribeSession(
        client_ws=ws,
        elevenlabs_api_key=elevenlabs_api_key,
        model_id=model_id,
        language_code=language_code,
        audio_format=audio_format,
        sample_rate=sample_rate,
        include_timestamps=include_timestamps,
    )
    
    await session.start()
