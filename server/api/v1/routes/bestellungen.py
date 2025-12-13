from fastapi import APIRouter
from typing import List, Dict
from ..services.bestellungen_service import get_all_bestellungen_with_items

router = APIRouter(prefix="/bestellungen", tags=["bestellungen"])

@router.get("/", response_model=List[Dict])
async def get_all_orders_with_items():
    """Get all orders with their associated order items."""
    orders = get_all_bestellungen_with_items()
    return orders

