from fastapi import APIRouter
from typing import List, Dict
from ..services.inventory_service import get_all_inventory

router = APIRouter(prefix="/inventory", tags=["inventory"])

@router.get("/", response_model=List[Dict])
async def get_all_inventory_items():
    """Get all inventory items from the database."""
    items = get_all_inventory()
    return items
