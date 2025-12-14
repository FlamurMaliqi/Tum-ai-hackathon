import os
from pathlib import Path

from dotenv import load_dotenv, find_dotenv
from fastapi import FastAPI

from api.v1.routes import artikel_router, inventory_router, elevenlabs_client_token_router, ws_router, voice_processing_router, bestellungen_router, bauprojekte_router, construction_sites_router
from cors import configure_cors
import uvicorn

# Try multiple methods to find and load the .env file
# Method 1: find_dotenv() searches up the directory tree
dotenv_file = find_dotenv()
if dotenv_file:
    print(f"Found .env file at: {dotenv_file}")
    load_dotenv(dotenv_path=dotenv_file)
else:
    # Method 2: Look in the same directory as main.py
    env_path = Path(__file__).parent / '.env'
    print(f"Trying .env file at: {env_path}")
    load_dotenv(dotenv_path=env_path)

# Debug: Print API key status
api_key = os.getenv("ELEVENLABS_API_KEY")
print(f"ELEVENLABS_API_KEY loaded: {'YES (' + str(len(api_key)) + ' chars)' if api_key else 'NO'}")

app = FastAPI(
    title="Artikel API",
    description="API for managing construction articles",
    version="1.0.0"
)

apiPrefix = "/api/v1"

# CORS configuration (single source of truth in server/cors.py)
configure_cors(app)

# Include routers
app.include_router(artikel_router, prefix=apiPrefix)
app.include_router(inventory_router, prefix=apiPrefix)
app.include_router(elevenlabs_client_token_router, prefix=apiPrefix)  
app.include_router(ws_router, prefix=apiPrefix)
app.include_router(voice_processing_router, prefix=apiPrefix)
app.include_router(bestellungen_router, prefix=apiPrefix)
app.include_router(bauprojekte_router, prefix=apiPrefix)
app.include_router(construction_sites_router, prefix=apiPrefix)  


@app.get("/")
async def root():
    return {"message": "Artikel API is running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

def main():
    # Use port from environment variable or default to 8000
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)


if __name__ == "__main__":
    main()
