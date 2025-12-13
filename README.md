# Comstruct

### Real-time WebSocket (FastAPI ↔ Browser)

This repo includes a minimal, production-ready WebSocket setup intended as the foundation for streaming AI / voice:

- **Endpoint**: `GET /websocket` (WebSocket upgrade)
- **Transport**: WebSocket only (no polling / no HTTP fetch)
- **Frames**:
  - **Text frames (JSON)** for structured messages
  - **Binary frames (raw bytes)** for future audio streaming (no base64)

## Server (FastAPI)

### Run the server

From the repo root, run your FastAPI app (however you already run it). If you’re using the included entrypoint:

```bash
python3 server/main.py
```

The server will listen on `0.0.0.0:8000`.

### WebSocket protocol

The server accepts JSON messages with a `type` field and responds with JSON and (optionally) binary frames.

- **Send user message**:

```json
{ "type": "user_message", "text": "hello" }
```

The server will:
- Ack with a JSON message (`type: "server_message"`)
- Stream a response using multiple JSON messages (`assistant_start` → repeated `assistant_token` → `assistant_done`)
- Send a **binary frame** as a placeholder for future audio output

- **Interrupt streaming**:

```json
{ "type": "interrupt" }
```

The server cancels any active stream task and confirms with JSON (`stream_cancelled`, `server_message`).

## Client (Browser / plain JS)

### Demo client

Open `testing/index.html` in a browser and click **Connect**.

- If opened via `file://`, the client defaults to `ws://localhost:8000/websocket`.
- If served over HTTPS, the client will automatically use `wss://…/websocket`.

### Integrate in your app (minimal snippet)

```js
const ws = new WebSocket("ws://localhost:8000/websocket");
ws.binaryType = "arraybuffer";

ws.onopen = () => {
  ws.send(JSON.stringify({ type: "user_message", text: "hello" }));
};

ws.onmessage = (event) => {
  if (typeof event.data === "string") {
    console.log("json", JSON.parse(event.data));
  } else {
    // ArrayBuffer / Blob depending on environment
    console.log("binary bytes", event.data.byteLength ?? event.data.size);
  }
};
```

## Where the code lives

- **Server WebSocket endpoint**: `server/api/v1/routes/websocket.py`
- **Server app wiring**: `server/main.py`
- **Demo client**: `testing/index.html`
