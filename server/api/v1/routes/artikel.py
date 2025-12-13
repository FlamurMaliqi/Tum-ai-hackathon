import logging
from fastapi import APIRouter, Query
from typing import List, Dict, Optional
from ..services.artikel_service import get_all_artikel

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/artikel", tags=["artikel"])

@router.get("/", response_model=List[Dict])
async def get_all_articles(
    search: Optional[str] = Query(None, description="Search term for artikelname or lieferant"),
    category: Optional[str] = Query(None, description="Filter by category (kategorie)")
):
    """
    Get articles from the database with optional search and category filtering.
    
    Query Parameters:
        search: Optional search term to filter by artikelname or lieferant
        category: Optional category to filter by kategorie
    """
    # Filter out empty strings
    search = search.strip() if search and search.strip() else None
    category = category.strip() if category and category.strip() else None
    
    logger.info(f"Fetching articles with search='{search}', category='{category}'")
    articles = get_all_artikel(search=search, category=category)
    logger.info(f"Returning {len(articles)} articles")
    return articles
