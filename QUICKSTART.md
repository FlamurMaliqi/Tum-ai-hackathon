# ElevenLabs Realtime Speech-to-Text - Quick Start Guide

## ✅ What's Been Implemented

### Backend (Python/FastAPI)
- ✅ ElevenLabs Python SDK installed
- ✅ Token generation endpoint: `/api/v1/elevenlabs-token/`
- ✅ WebSocket proxy service: `/api/v1/scribe/ws`
- ✅ Bidirectional audio streaming to ElevenLabs API
- ✅ Real-time transcript forwarding to client
- ✅ Error handling and connection management

### Frontend (React/TypeScript)
- ✅ ElevenLabs React SDK installed (`@elevenlabs/react`)
- ✅ Voice.tsx updated with `useScribe` hook
- ✅ Microphone recording controls
- ✅ Real-time transcript display
- ✅ Partial and committed transcript handling
- ✅ Modern UI with recording indicators

## 🚀 How to Run

### 1. Set Up Environment Variables

Create or update `server/.env`:
```env
ELEVENLABS_API_KEY=your_api_key_here
```

**Get your API key from:** https://elevenlabs.io/app/settings/api-keys

### 2. Start the Backend

```bash
cd server
python main.py
```

Server runs on: http://localhost:8000

### 3. Start the Frontend

```bash
cd client
npm run dev
```

Frontend runs on: http://localhost:5173

### 4. Test the Integration

**Option 1: Use the test script**
```bash
cd server
python test_elevenlabs.py
```

**Option 2: Use the UI**
1. Navigate to the Voice page
2. Click the microphone button
3. Allow microphone access
4. Start speaking
5. Watch real-time transcription appear

## 📋 Key Features

### Real-Time Transcription
- **Partial transcripts**: Live updates as you speak (shown with pulse animation)
- **Committed transcripts**: Finalized text after pauses (saved to history)
- **Ultra-low latency**: Millisecond response times

### Audio Processing
- Format: PCM 16kHz, 16-bit, mono
- Automatic echo cancellation
- Noise suppression
- Auto gain control

### Security
- API key never exposed to client
- Single-use tokens (expire after 15 minutes)
- Secure WebSocket connections

## 🔧 Architecture

```
┌─────────────┐          ┌──────────────┐          ┌──────────────┐
│   Browser   │          │   FastAPI    │          │  ElevenLabs  │
│  (Frontend) │◄────────►│   (Backend)  │◄────────►│     API      │
└─────────────┘          └──────────────┘          └──────────────┘
     │                          │                          │
     │ 1. Request Token         │                          │
     │─────────────────────────►│                          │
     │                          │ 2. Generate Token        │
     │                          │─────────────────────────►│
     │                          │◄─────────────────────────│
     │◄─────────────────────────│                          │
     │ 3. Connect WebSocket     │                          │
     │─────────────────────────►│ 4. Proxy Connection      │
     │                          │─────────────────────────►│
     │ 5. Stream Audio          │                          │
     │─────────────────────────►│─────────────────────────►│
     │◄─────────────────────────│◄─────────────────────────│
     │ 6. Receive Transcripts   │                          │
```

## 📁 Files Created/Modified

### Backend
- ✅ `server/api/v1/services/scribe_service.py` - WebSocket proxy service
- ✅ `server/api/v1/routes/scribe.py` - WebSocket endpoint
- ✅ `server/api/v1/routes/__init__.py` - Router registration
- ✅ `server/main.py` - Added scribe router
- ✅ `server/pyproject.toml` - Added dependencies
- ✅ `server/test_elevenlabs.py` - Test script

### Frontend
- ✅ `client/src/pages/Voice.tsx` - Updated with real transcription
- ✅ `client/package.json` - Added @elevenlabs/react

### Documentation
- ✅ `ELEVENLABS_INTEGRATION.md` - Comprehensive guide
- ✅ `QUICKSTART.md` - This file

## 🎯 Next Steps (Optional Enhancements)

### 1. Product Extraction (NLP)
Add AI to extract products from transcripts:
```tsx
onCommittedTranscript: async (data) => {
  // Use OpenAI/Claude to extract:
  // - Product names
  // - Quantities
  // - Units
  const products = await extractProducts(data.text);
  setOrderItems(prev => [...prev, ...products]);
}
```

### 2. Language Selection
Add a dropdown to select language:
```tsx
const [language, setLanguage] = useState("de");
// Use language in WebSocket connection
```

### 3. Confidence Scores
Display confidence levels for transcripts:
```tsx
onCommittedTranscriptWithTimestamps: (data) => {
  // data.words contains confidence scores
  console.log(data.words);
}
```

### 4. Voice Commands
Implement special commands:
- "Bestellen" → Submit order
- "Löschen" → Clear order
- "Zurück" → Navigate back

### 5. Multi-Session Support
Allow multiple concurrent transcription sessions with session management.

## 🐛 Troubleshooting

### "Cannot connect to server"
- Make sure backend is running: `python main.py`
- Check port 8000 is not in use
- Verify CORS settings in main.py

### "Failed to fetch token"
- Check ELEVENLABS_API_KEY in .env
- Verify API key is valid (test on ElevenLabs dashboard)
- Check backend logs for errors

### "Microphone not working"
- Grant browser microphone permissions
- Test microphone in system settings
- Try a different browser (Chrome/Edge recommended)

### "No transcripts appearing"
- Speak clearly and loudly enough
- Check network tab for WebSocket connection
- Look for errors in browser console
- Verify ElevenLabs API quota

## 📚 Resources

- **ElevenLabs Docs**: https://elevenlabs.io/docs/developers/guides/cookbooks/speech-to-text/streaming
- **React SDK**: https://www.npmjs.com/package/@elevenlabs/react
- **API Reference**: https://elevenlabs.io/docs/api-reference
- **Dashboard**: https://elevenlabs.io/app

## 💡 Tips

1. **Test with simple phrases first** to verify the system is working
2. **Use headphones** to avoid echo/feedback
3. **Speak in natural sentences** with pauses between thoughts
4. **Check the browser console** for detailed error messages
5. **Monitor backend logs** for server-side issues

## 📞 Support

If you encounter issues:
1. Check the detailed documentation in `ELEVENLABS_INTEGRATION.md`
2. Review the test script output: `python test_elevenlabs.py`
3. Check ElevenLabs status page for API issues
4. Review browser console and network tab for errors

---

**Ready to test?** Run the test script or open the Voice page and start speaking! 🎤
