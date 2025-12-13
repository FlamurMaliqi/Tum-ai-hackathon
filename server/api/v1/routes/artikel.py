from fastapi import APIRouter
from typing import List, Dict
from ..services.artikel_service import get_all_artikel

router = APIRouter(prefix="/artikel", tags=["artikel"])

@router.get("/", response_model=List[Dict])
async def get_all_articles():
    """Get all articles from the database."""
    articles = get_all_artikel()
    return articles
