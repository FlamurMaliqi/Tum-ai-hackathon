from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/websocket", tags=["voice"])


class VoiceTranscriptRequest(BaseModel):
    transcript: str


class OrderItem(BaseModel):
    productId: str
    name: str
    quantity: int
    unit: str


class VoiceTranscriptResponse(BaseModel):
    orderItem: OrderItem | None = None
    message: str | None = None


@router.post("/process-voice")
async def process_voice_transcript(request: VoiceTranscriptRequest) -> VoiceTranscriptResponse:
    """
    Process voice transcript and extract order items.
    
    This endpoint receives transcribed text from the frontend and uses NLP
    to identify products and quantities mentioned in the speech.
    """
    transcript = request.transcript.strip().lower()
    
    if not transcript:
        return VoiceTranscriptResponse(message="Empty transcript")
    
    # TODO: Implement actual NLP processing here
    # For now, return a placeholder response
    # In production, this should:
    # 1. Parse the transcript for product names and quantities
    # 2. Match products against the inventory database
    # 3. Extract quantities and units
    # 4. Return structured order items
    
    # Placeholder logic - detect simple patterns
    # Example: "5 säcke zement" or "10 meter kabel"
    
    return VoiceTranscriptResponse(
        message=f"Processed transcript: {transcript}"
    )
