import os

from fastapi import APIRouter, HTTPException, status

from ..services.elevenlabs_service import generate_realtime_scribe_single_use_token


router = APIRouter(prefix="/elevenlabs-token" , tags=["elevenlabs"])


@router.get("/")
async def get_elevenlabs_client_token() -> dict:
    """
    Generate a single-use ElevenLabs Speech-to-Text (Realtime Scribe) token.
    """
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="ELEVENLABS_API_KEY is not set",
        )

    token = await generate_realtime_scribe_single_use_token(api_key=api_key)
    return {"token": token}

