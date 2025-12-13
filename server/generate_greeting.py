"""Generate greeting MP3 file."""
import asyncio
import json
import websockets

GREETING = "Hi — I can help you put together a quick supply order for the site. Whenever you're ready, tell me what you need and how many, and we'll build the order together, making sure you get the best value."

async def generate():
    uri = "ws://localhost:8001/api/v1/websocket/"
    
    async with websockets.connect(uri) as ws:
        await ws.recv()  # server_hello
        
        await ws.send(json.dumps({
            "type": "user_message",
            "text": GREETING
        }))
        print("Generating greeting audio...")
        
        audio_data = b""
        while True:
            try:
                msg = await asyncio.wait_for(ws.recv(), timeout=30)
                if isinstance(msg, bytes):
                    audio_data += msg
                    print(".", end="", flush=True)
                else:
                    data = json.loads(msg)
                    if data.get("type") == "assistant_done":
                        break
                    if data.get("type") == "error":
                        print(f"\nError: {data.get('message')}")
                        return
            except asyncio.TimeoutError:
                break
        
        # Save to client/public folder
        output_path = "../client/public/greeting.mp3"
        with open(output_path, "wb") as f:
            f.write(audio_data)
        print(f"\n\n✅ Saved to {output_path} ({len(audio_data)} bytes)")

if __name__ == "__main__":
    asyncio.run(generate())
