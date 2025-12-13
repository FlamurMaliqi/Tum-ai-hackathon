import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.v1.routes import artikel_router, inventory_router, elevenlabs_client_token_router, ws_router, voice_processing_router
import uvicorn

load_dotenv()

app = FastAPI(
    title="Artikel API",
    description="API for managing construction articles",
    version="1.0.0"
)

# Configure CORS to allow WebSocket connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

apiPrefix = "/api/v1"

# Include routers
app.include_router(artikel_router, prefix=apiPrefix)
app.include_router(inventory_router, prefix=apiPrefix)
app.include_router(elevenlabs_client_token_router, prefix=apiPrefix)  
app.include_router(ws_router, prefix=apiPrefix)
app.include_router(voice_processing_router, prefix=apiPrefix)  

@app.get("/")
async def root():
    return {"message": "Artikel API is running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

def main():
    uvicorn.run(app, host="0.0.0.0", port=8000)


if __name__ == "__main__":
    main()
