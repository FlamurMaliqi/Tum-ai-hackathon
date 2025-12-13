from fastapi import APIRouter, HTTPException, status
from fastapi import Query
from typing import List, Dict, Optional
from pydantic import BaseModel
from ..services.bestellungen_service import get_all_bestellungen_with_items, create_bestellung, update_bestellung_status
from ..data_access.database import get_db_connection
import json
from datetime import datetime

router = APIRouter(prefix="/bestellungen", tags=["bestellungen"])


class OrderItem(BaseModel):
    artikel_id: str
    artikel_name: str
    menge: int
    einheit: str
    einzelpreis: float


class OrderCreate(BaseModel):
    polier_name: str
    projekt_name: str
    items: List[OrderItem]
    erstellt_von: Optional[str] = None


@router.get("/")
async def get_all_orders():
    """Get all orders with their details"""
    try:
        orders = get_all_bestellungen_with_items()
        return orders
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch orders: {str(e)}"
        )


@router.get("/{order_id}")
async def get_order(order_id: str):
    """Get a specific order by ID"""
    try:
        all_orders = get_all_bestellungen_with_items()
        order = next((o for o in all_orders if o['bestell_id'] == order_id), None)
        
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        return order
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch order: {str(e)}"
        )


@router.post("/")
async def create_order(order: OrderCreate):
    """Create a new order with automatic approval for orders under 100€"""
    try:
        # Convert Pydantic models to dicts
        items = [item.dict() for item in order.items]
        
        new_order = create_bestellung(
            polier_name=order.polier_name,
            projekt_name=order.projekt_name,
            items=items,
            erstellt_von=order.erstellt_von
        )
        
        # Add approval message
        gesamt_betrag = float(new_order['gesamt_betrag'])
        if gesamt_betrag < 100:
            new_order['approval_message'] = "Auto-approved (under 100€)"
        else:
            new_order['approval_message'] = "Requires approval (100€ or more)"
        
        return new_order
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create order: {str(e)}"
        )


@router.put("/{order_id}/status")
async def update_order_status(
    order_id: str, 
    new_status: str = Query(...),
    genehmigt_von: Optional[str] = Query(None),
    admin_notizen: Optional[str] = Query(None)
):
    """Update order status (Admin only)"""
    valid_statuses = ['pending', 'approved', 'rejected', 'delivered']
    
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )
    
    try:
        updated_order = update_bestellung_status(
            bestell_id=order_id,
            new_status=new_status,
            genehmigt_von=genehmigt_von,
            admin_notizen=admin_notizen
        )
        
        return {
            "bestell_id": updated_order['bestell_id'],
            "status": updated_order['status'],
            "message": "Order status updated successfully"
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update order status: {str(e)}"
        )


@router.put("/{order_id}/approve")
async def approve_order(order_id: str, genehmigt_von: Optional[str] = None, admin_notizen: Optional[str] = None):
    """Approve a pending order (Admin only) - Quick action endpoint"""
    return await update_order_status(order_id, 'approved', genehmigt_von, admin_notizen)


@router.put("/{order_id}/reject")
async def reject_order(order_id: str, genehmigt_von: Optional[str] = None, admin_notizen: Optional[str] = None):
    """Reject/cancel a pending order (Admin only) - Quick action endpoint"""
    return await update_order_status(order_id, 'rejected', genehmigt_von, admin_notizen)


@router.get("/pending")
async def get_pending_orders():
    """Get all orders that require approval (status=pending)"""
    try:
        all_orders = get_all_bestellungen_with_items()
        pending_orders = [order for order in all_orders if order['status'] == 'pending']
        return {"orders": pending_orders, "count": len(pending_orders)}
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch pending orders: {str(e)}"
        )


