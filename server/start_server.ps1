# Start server with environment variables loaded
$env:ELEVENLABS_API_KEY = "sk_14e663f6dcfd54bf0acf4f424d9c6a87fbc152c8e3c17909"
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
