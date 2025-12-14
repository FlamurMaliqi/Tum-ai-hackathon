# ElevenLabs Realtime Speech-to-Text Integration

This implementation integrates ElevenLabs Scribe v2 Realtime for real-time speech-to-text transcription in your application.

## Features

- **Real-time transcription** with ultra-low latency
- **Microphone streaming** directly from the browser
- **Partial and committed transcripts** for live feedback
- **Multi-language support** (optional language specification)
- **Word-level timestamps** (optional)
- **Secure token-based authentication** (API key never exposed to client)

## Architecture

### Backend (Python/FastAPI)
- **Token Generation**: `/api/v1/elevenlabs-token/` endpoint generates single-use tokens
- **WebSocket Bridge**: `/api/v1/scribe/ws` acts as a proxy between client and ElevenLabs
- **Service Layer**: `scribe_service.py` manages bidirectional WebSocket streaming

### Frontend (React/TypeScript)
- **ElevenLabs React SDK**: `@elevenlabs/react` provides the `useScribe` hook
- **Voice UI**: `Voice.tsx` component with microphone controls and live transcription display

## Setup

### 1. Backend Setup

#### Install Dependencies

```bash
cd server
pip install elevenlabs websockets httpx
```

Or if using `uv`:

```bash
uv add elevenlabs websockets
```

#### Configure Environment Variables

Create a `.env` file in the `server` directory:

```env
ELEVENLABS_API_KEY=your_api_key_here
```

**Get your API key:**
1. Go to [ElevenLabs Dashboard](https://elevenlabs.io/app/settings/api-keys)
2. Create a new API key
3. Copy and paste it into your `.env` file

#### Start the Backend Server

```bash
cd server
python main.py
```

Server will run on `http://localhost:8000`

### 2. Frontend Setup

#### Install Dependencies

```bash
cd client
npm install @elevenlabs/react
```

#### Configure API URL

Make sure your frontend is configured to connect to the backend at `http://localhost:8000`.

#### Start the Frontend

```bash
cd client
npm run dev
```

Frontend will run on `http://localhost:5173`

## Usage

### Using the Voice Interface

1. Navigate to the Voice page in your application
2. Click the microphone button to start recording
3. Speak your order or command
4. The system will transcribe in real-time:
   - **Partial transcripts**: Show live as you speak (updates continuously)
   - **Committed transcripts**: Finalized after pauses (stored permanently)
5. Click the microphone button again to stop recording

### Understanding Transcript Types

#### Partial Transcripts
- Appear in real-time as you speak
- May change as more context is received
- Shown with an animated pulse effect
- Not saved to history

#### Committed Transcripts
- Finalized when the system detects a pause or segment end
- Stored in the transcript history
- Used for processing and product extraction
- Cannot be changed once committed

## API Reference

### Backend Endpoints

#### GET `/api/v1/elevenlabs-token/`
Generates a single-use token for ElevenLabs Scribe API.

**Response:**
```json
{
  "token": "single_use_token_here"
}
```

**Token Expiry:** 15 minutes

#### WebSocket `/api/v1/scribe/ws`
Bidirectional WebSocket for real-time speech-to-text.

**Query Parameters:**
- `language_code` (optional): ISO language code (e.g., `en`, `de`, `es`)
- `include_timestamps` (optional): Boolean, default `false`

**Client → Server Messages:**

1. **Audio Chunk:**
```json
{
  "type": "audio_chunk",
  "audio_base64": "base64_encoded_pcm_audio",
  "sample_rate": 16000
}
```

2. **Commit Segment:**
```json
{
  "type": "commit"
}
```

3. **Stop Session:**
```json
{
  "type": "stop"
}
```

**Server → Client Messages:**

1. **Session Started:**
```json
{
  "type": "session_started",
  "data": {
    "session_id": "...",
    "model_id": "scribe_v2_realtime",
    ...
  }
}
```

2. **Partial Transcript:**
```json
{
  "type": "partial_transcript",
  "data": {
    "text": "Hello, I would like to order..."
  }
}
```

3. **Committed Transcript:**
```json
{
  "type": "committed_transcript",
  "data": {
    "text": "Hello, I would like to order 100 screws."
  }
}
```

4. **Error:**
```json
{
  "type": "error",
  "data": {
    "message": "Error description"
  }
}
```

## Frontend Integration

### Using the `useScribe` Hook

```tsx
import { useScribe } from "@elevenlabs/react";

const scribe = useScribe({
  modelId: "scribe_v2_realtime",
  onPartialTranscript: (data) => {
    console.log("Live:", data.text);
  },
  onCommittedTranscript: (data) => {
    console.log("Final:", data.text);
  },
  onError: (error) => {
    console.error("Error:", error);
  },
});

// Start recording
const startRecording = async () => {
  const response = await fetch("http://localhost:8000/api/v1/elevenlabs-token/");
  const { token } = await response.json();
  
  await scribe.connect({
    token,
    microphone: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });
};

// Stop recording
const stopRecording = () => {
  scribe.disconnect();
};
```

### Accessing Transcripts

```tsx
// Partial transcript (live)
scribe.partialTranscript

// All committed transcripts
scribe.committedTranscripts

// Connection status
scribe.isConnected
```

## Configuration Options

### Audio Settings

The system uses **PCM 16kHz, 16-bit, mono** audio format:
- Sample Rate: 16000 Hz
- Bit Depth: 16-bit
- Channels: Mono (1 channel)
- Encoding: PCM (little-endian)

### Microphone Options

```tsx
{
  echoCancellation: true,    // Removes echo from speakers
  noiseSuppression: true,    // Reduces background noise
  autoGainControl: true,     // Normalizes volume levels
}
```

### Commit Strategy

The system uses **Voice Activity Detection (VAD)** by default:
- Automatically commits when speech pauses are detected
- Default silence threshold: 1.5 seconds
- Can be configured in `scribe_service.py`

Manual commit is also supported via the `commit` message type.

## Troubleshooting

### No transcripts appearing

1. **Check API key**: Ensure `ELEVENLABS_API_KEY` is set in `.env`
2. **Check microphone permissions**: Browser must allow microphone access
3. **Check audio format**: Verify PCM 16kHz is being used
4. **Check network**: Ensure WebSocket connections are not blocked

### "Failed to fetch ElevenLabs token" error

- Backend server may not be running
- API key may be invalid or missing
- Check backend logs for errors

### High latency

- Reduce chunk size (though 16kHz is optimal)
- Check network connection
- Ensure backend and ElevenLabs servers are reachable

### Audio quality issues

- Ensure microphone is working properly
- Enable echo cancellation and noise suppression
- Use a quality microphone in a quiet environment
- Check microphone gain levels (avoid clipping)

## Best Practices

### 1. Token Management
- Always fetch tokens on-demand (they expire after 15 minutes)
- Never store tokens in frontend code or localStorage
- Always use the backend endpoint to generate tokens

### 2. Error Handling
- Implement reconnection logic for dropped connections
- Show clear error messages to users
- Log errors for debugging

### 3. Audio Quality
- Use noise suppression and echo cancellation
- Test with different microphone types
- Handle background noise gracefully

### 4. User Experience
- Show clear recording state indicators
- Display both partial and committed transcripts
- Provide visual feedback during processing
- Allow users to manually stop/start recording

### 5. Performance
- Commit segments regularly (every 20-30 seconds)
- Don't send excessively large audio chunks
- Clean up WebSocket connections on unmount

## Next Steps

### Product Extraction (TODO)
Currently, the committed transcripts are logged but not processed. To extract products and quantities:

1. **NLP Processing**: Use OpenAI, Anthropic, or similar to extract:
   - Product names
   - Quantities
   - Units
   
2. **Product Matching**: Match extracted text to your product database

3. **Order Building**: Add matched products to the order list

Example implementation:
```tsx
onCommittedTranscript: async (data) => {
  const text = data.text;
  
  // Call your AI/NLP service
  const products = await extractProducts(text);
  
  // Add to order
  products.forEach(product => {
    setOrderItems(prev => [...prev, product]);
  });
}
```

## Resources

- [ElevenLabs Scribe Documentation](https://elevenlabs.io/docs/developers/guides/cookbooks/speech-to-text/streaming)
- [ElevenLabs API Reference](https://elevenlabs.io/docs/api-reference)
- [ElevenLabs React SDK](https://www.npmjs.com/package/@elevenlabs/react)
- [WebSocket Protocol](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

## License

MIT
