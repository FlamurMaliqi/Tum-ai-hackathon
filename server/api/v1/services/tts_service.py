"""
Minimal ElevenLabs streaming TTS service.

Flow:
1. Open WebSocket to ElevenLabs
2. Send text chunks as they arrive from Claude
3. Receive audio chunks and yield them back
"""
import os
import json
import base64
import asyncio
import websockets

# Default voice - "Charlotte" (warm, sultry tone)
DEFAULT_VOICE_ID = "XB0fDUnXU5powFXDhCwa"


async def stream_tts(text_iterator):
    """
    Takes an async iterator of text chunks, yields audio chunks.
    
    Usage:
        async for audio_bytes in stream_tts(claude_text_stream):
            # send audio_bytes to client
    """
    api_key = os.getenv("ELEVENLABS_API_KEY")
    voice_id = os.getenv("ELEVENLABS_VOICE_ID", DEFAULT_VOICE_ID)
    model_id = "eleven_multilingual_v2"
    
    uri = f"wss://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream-input?model_id={model_id}&output_format=mp3_44100_128"
    
    async with websockets.connect(uri) as ws:
        # Send initial config (BOS - Beginning of Stream)
        await ws.send(json.dumps({
            "text": " ",
            "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
            "xi_api_key": api_key
        }))
        
        # Task to receive audio chunks
        audio_queue = asyncio.Queue()
        done_event = asyncio.Event()
        
        async def receive_audio():
            try:
                async for message in ws:
                    data = json.loads(message)
                    if data.get("audio"):
                        audio_bytes = base64.b64decode(data["audio"])
                        await audio_queue.put(audio_bytes)
                    if data.get("isFinal"):
                        break
            finally:
                done_event.set()
        
        # Start receiving audio in background
        receive_task = asyncio.create_task(receive_audio())
        
        # Send text chunks as they arrive
        async for text_chunk in text_iterator:
            if text_chunk:
                await ws.send(json.dumps({"text": text_chunk}))
        
        # Signal end of text (EOS)
        await ws.send(json.dumps({"text": ""}))
        
        # Yield audio chunks as they arrive
        while not done_event.is_set() or not audio_queue.empty():
            try:
                audio = await asyncio.wait_for(audio_queue.get(), timeout=0.1)
                yield audio
            except asyncio.TimeoutError:
                continue
        
        await receive_task
