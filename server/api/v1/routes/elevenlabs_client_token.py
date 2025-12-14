import os

from fastapi import APIRouter, HTTPException, status

from ..services.elevenlabs_service import generate_realtime_scribe_single_use_token


router = APIRouter(prefix="/elevenlabs-token" , tags=["elevenlabs"])


@router.get("/")
async def get_elevenlabs_client_token() -> dict:
    """
    Generate a single-use ElevenLabs Speech-to-Text (Realtime Scribe) token.
    """
    # Try to get from environment
    api_key = os.getenv("ELEVENLABS_API_KEY")
    
    # Fallback: hardcoded key (TEMPORARY - for development only)
    if not api_key:
        api_key = "sk_14e663f6dcfd54bf0acf4f424d9c6a87fbc152c8e3c17909"
    
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="ELEVENLABS_API_KEY is not set",
        )

    token = await generate_realtime_scribe_single_use_token(api_key=api_key)
    return {"token": token}

