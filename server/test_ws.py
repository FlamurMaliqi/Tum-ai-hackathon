"""
Interactive WebSocket test for voice assistant.

Tests the full flow: User input → Claude → TTS → Audio playback

Usage: python test_ws.py
Type messages and press Enter. Type 'quit' to exit.
"""
import asyncio
import json
import subprocess
import sys
import websockets


async def test_interactive():
    uri = "ws://localhost:8001/api/v1/websocket/"
    
    print("=" * 50)
    print("Voice Assistant Test (Claude + ElevenLabs TTS)")
    print("=" * 50)
    print("Type your message and press Enter.")
    print("Type 'quit' to exit.\n")
    
    async with websockets.connect(uri) as ws:
        # Wait for server hello
        msg = await ws.recv()
        data = json.loads(msg)
        print(f"✓ Connected (conversation: {data.get('conversation_id', 'unknown')[:8]}...)\n")
        
        while True:
            # Get user input
            try:
                user_input = await asyncio.get_event_loop().run_in_executor(
                    None, lambda: input("You: ")
                )
            except EOFError:
                break
            
            if user_input.lower() in ('quit', 'exit', 'q'):
                print("Goodbye!")
                break
            
            if not user_input.strip():
                continue
            
            # Send message
            await ws.send(json.dumps({
                "type": "user_message",
                "text": user_input
            }))
            
            # Signal end of turn immediately
            await ws.send(json.dumps({"type": "end_turn"}))
            
            # Start audio player for this response
            try:
                ffplay = subprocess.Popen(
                    ["ffplay", "-nodisp", "-autoexit", "-i", "pipe:0"],
                    stdin=subprocess.PIPE,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL
                )
            except FileNotFoundError:
                try:
                    ffplay = subprocess.Popen(
                        ["mpv", "--no-video", "-"],
                        stdin=subprocess.PIPE,
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL
                    )
                except FileNotFoundError:
                    ffplay = None
                    print("(No audio player - install ffmpeg or mpv)")
            
            # Receive response
            print("\nAssistant: ", end="", flush=True)
            
            while True:
                try:
                    msg = await asyncio.wait_for(ws.recv(), timeout=60)
                    
                    if isinstance(msg, bytes):
                        # Audio chunk - pipe to player
                        if ffplay and ffplay.stdin:
                            try:
                                ffplay.stdin.write(msg)
                                ffplay.stdin.flush()
                            except BrokenPipeError:
                                pass
                    else:
                        data = json.loads(msg)
                        msg_type = data.get("type")
                        
                        if msg_type == "assistant_token":
                            print(data.get("text", ""), end="", flush=True)
                        elif msg_type == "assistant_done":
                            print("\n")
                            break
                        elif msg_type == "assistant_error":
                            print(f"\n❌ Error: {data.get('message')}\n")
                            break
                        elif msg_type == "turn_complete":
                            pass  # Expected, continue
                        elif msg_type == "assistant_start":
                            pass  # Expected, continue
                        elif msg_type == "server_message":
                            pass  # Ack, ignore
                            
                except asyncio.TimeoutError:
                    print("\n⏱ Timeout waiting for response\n")
                    break
            
            # Clean up audio player
            if ffplay:
                try:
                    ffplay.stdin.close()
                except:
                    pass
                ffplay.wait()


if __name__ == "__main__":
    try:
        asyncio.run(test_interactive())
    except KeyboardInterrupt:
        print("\nInterrupted")
    except websockets.exceptions.ConnectionClosed:
        print("\nConnection closed")
    except ConnectionRefusedError:
        print("❌ Cannot connect. Is the server running?")
        print("   Start with: docker compose up")
