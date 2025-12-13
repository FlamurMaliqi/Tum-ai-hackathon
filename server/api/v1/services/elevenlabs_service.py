import httpx
from fastapi import HTTPException, status


async def generate_realtime_scribe_single_use_token(*, api_key: str) -> str:
    """
    Calls ElevenLabs to generate a single-use token for Realtime Scribe (Speech-to-Text).
    Returns the token string.
    """
    url = "https://api.elevenlabs.io/v1/single-use-token/realtime_scribe"
    headers = {"xi-api-key": api_key}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, headers=headers)
            resp.raise_for_status()
    except httpx.HTTPStatusError as e:
        # Surface upstream failure details without leaking credentials.
        try:
            upstream_body = e.response.json()
        except Exception:
            upstream_body = e.response.text

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={
                "message": "Failed to create ElevenLabs single-use token",
                "status_code": e.response.status_code,
                "response": upstream_body,
            },
        ) from e
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"message": "Error connecting to ElevenLabs", "error": str(e)},
        ) from e

    try:
        data = resp.json()
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Invalid JSON received from ElevenLabs",
        ) from e

    token = data.get("token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"message": "Missing token in ElevenLabs response", "response": data},
        )

    return token

