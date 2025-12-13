"""Quick test script for WebSocket voice assistant - streams audio in real-time."""
import asyncio
import json
import subprocess
import websockets

async def test():
    uri = "ws://localhost:8000/api/v1/websocket/"
    
    # Start audio player to receive piped audio (mp3 format)
    # Use ffplay (from ffmpeg) or mpv - whichever you have installed
    try:
        ffplay = subprocess.Popen(
            ["ffplay", "-nodisp", "-autoexit", "-i", "pipe:0"],
            stdin=subprocess.PIPE,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
    except FileNotFoundError:
        ffplay = subprocess.Popen(
            ["mpv", "--no-video", "-"],
            stdin=subprocess.PIPE,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
    
    async with websockets.connect(uri) as ws:
        msg = await ws.recv()
        print(f"Connected: {msg}")
        
        # Send test message
        await ws.send(json.dumps({
            "type": "user_message",
            "text": "Hi — I can help you put together a quick supply order for the site. Whenever you’re ready, tell me what you need and how many, and we’ll build the order together."
        }))
        print("Sent message, waiting for response...\n")
        
        while True:
            try:
                msg = await asyncio.wait_for(ws.recv(), timeout=30)
                if isinstance(msg, bytes):
                    # Pipe audio directly to ffplay
                    ffplay.stdin.write(msg)
                    ffplay.stdin.flush()
                else:
                    data = json.loads(msg)
                    if data.get("type") == "assistant_token":
                        print(data.get("text", ""), end="", flush=True)
                    elif data.get("type") == "assistant_done":
                        print("\n\n✅ Done!")
                        break
                    elif data.get("type") == "error":
                        print(f"\n❌ Error: {data.get('message')}")
                        break
            except asyncio.TimeoutError:
                print("\nTimeout")
                break
    
    ffplay.stdin.close()
    ffplay.wait()

if __name__ == "__main__":
    asyncio.run(test())
