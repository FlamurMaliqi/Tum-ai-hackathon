import logging
from fastapi import APIRouter, Query
from typing import List, Dict, Optional
from ..services.artikel_service import get_all_artikel, get_alternative_products

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


@router.get("/alternatives/{artikelname}", response_model=List[Dict])
async def get_alternatives(
    artikelname: str,
    exclude_id: Optional[str] = Query(None, description="Artikel ID to exclude from alternatives")
):
    """
    Get alternative products with the same name but different supplier.
    
    Query Parameters:
        exclude_id: Optional artikel_id to exclude from results
    """
    logger.info(f"Fetching alternatives for '{artikelname}'")
    alternatives = get_alternative_products(artikelname, exclude_id)
    logger.info(f"Found {len(alternatives)} alternatives")
    return alternatives
