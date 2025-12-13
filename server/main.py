import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.v1.routes import artikel_router, inventory_router, elevenlabs_client_token_router, ws_router, voice_processing_router, bestellungen_router, bauprojekte_router
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

# CORS configuration to allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:5174",
        "http://localhost:8083",  # Add your frontend port
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(artikel_router, prefix=apiPrefix)
app.include_router(inventory_router, prefix=apiPrefix)
app.include_router(elevenlabs_client_token_router, prefix=apiPrefix)  
app.include_router(ws_router, prefix=apiPrefix)
app.include_router(voice_processing_router, prefix=apiPrefix)
app.include_router(bestellungen_router, prefix=apiPrefix)
app.include_router(bauprojekte_router, prefix=apiPrefix)  


@app.get("/")
async def root():
    return {"message": "Artikel API is running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

def main():
    # Use port from environment variable or default to 8000
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)


if __name__ == "__main__":
    main()
