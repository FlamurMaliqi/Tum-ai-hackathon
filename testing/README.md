# Testing utilities

This folder contains small, self-contained demos for exercising the **FastAPI WebSocket** endpoint.

## WebSocket endpoint

- **Server endpoint**: `ws://localhost:8000/api/v1/websocket/`
- **Client → server JSON**: `{"type":"user_message","text":"..."}`
- **Server → client JSON**: `server_hello`, `server_message`, `assistant_start`, repeated `assistant_token`, `assistant_done`
- **Server → client binary**: placeholder bytes (future audio streaming)

## Demo: 5 seconds of “human text” (construction supervisor ordering 10 masks)

File: `testing/ws_construction_supervisor_5s_demo.html`

### 1) Start the server

This repo’s Python project lives in `server/`, so run the API from there:

```bash
cd server
uv sync
uv run python main.py
```

### 2) Open the demo page

Open `testing/ws_construction_supervisor_5s_demo.html` in your browser (double click in Finder, or drag into the browser).

Optional (serve it over HTTP instead of `file://`, still using uv):

```bash
cd server
uv run python -m http.server 8011 --directory ../testing
```

Then open `http://localhost:8011/ws_construction_supervisor_5s_demo.html`.

### 3) Run the demo

- Click **Connect**
- Click **Run 5s supervisor order**

You should see the page send 5 sentences (one per second) and the server reply with JSON acks + streamed `assistant_token` messages.

## General WebSocket playground

File: `testing/index.html`

This is a manual playground for connecting, sending `user_message`, sending `interrupt`, and sending a small binary payload.

