import logging
from fastapi import APIRouter, HTTPException, status
from typing import List, Dict
from ..services.construction_sites_service import get_all_construction_sites

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/construction-sites", tags=["construction-sites"])

@router.get("/", response_model=List[Dict])
async def get_all_construction_sites_endpoint():
    """
    Get all construction sites from the database.
    """
    try:
        logger.info("Fetching all construction sites")
        sites = get_all_construction_sites()
        logger.info(f"Returning {len(sites)} construction sites")
        return sites
    except Exception as e:
        logger.error(f"Failed to fetch construction sites: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch construction sites: {str(e)}"
        )

