from fastapi import APIRouter, HTTPException, status
from typing import List, Dict, Optional
from pydantic import BaseModel
from ..data_access.database import get_db_connection
import json

router = APIRouter(prefix="/bestellungen", tags=["bestellungen"])


class OrderItem(BaseModel):
    productId: str
    name: str
    quantity: int
    unit: str


class OrderCreate(BaseModel):
    projekt_id: Optional[int] = None
    items: List[OrderItem]
    notes: Optional[str] = None


@router.get("/")
async def get_all_orders():
    """Get all orders with their details"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            SELECT 
                b.id,
                b.projekt_id,
                bp.name as projekt_name,
                b.items,
                b.notes,
                b.total_items,
                b.status,
                b.created_at
            FROM bestellungen b
            LEFT JOIN bauprojekte bp ON b.projekt_id = bp.id
            ORDER BY b.created_at DESC
        """
        
        cursor.execute(query)
        columns = [desc[0] for desc in cursor.description]
        orders = []
        
        for row in cursor.fetchall():
            order = dict(zip(columns, row))
            # Convert timestamps to ISO format
            if order.get('created_at'):
                order['created_at'] = order['created_at'].isoformat()
            orders.append(order)
        
        cursor.close()
        conn.close()
        
        return {"orders": orders}
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch orders: {str(e)}"
        )


@router.get("/{order_id}")
async def get_order(order_id: int):
    """Get a specific order by ID"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            SELECT 
                b.id,
                b.projekt_id,
                bp.name as projekt_name,
                bp.description as projekt_description,
                bp.location as projekt_location,
                b.items,
                b.notes,
                b.total_items,
                b.status,
                b.created_at
            FROM bestellungen b
            LEFT JOIN bauprojekte bp ON b.projekt_id = bp.id
            WHERE b.id = %s
        """
        
        cursor.execute(query, (order_id,))
        row = cursor.fetchone()
        
        if not row:
            cursor.close()
            conn.close()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        columns = [desc[0] for desc in cursor.description]
        order = dict(zip(columns, row))
        
        # Convert timestamp to ISO format
        if order.get('created_at'):
            order['created_at'] = order['created_at'].isoformat()
        
        cursor.close()
        conn.close()
        
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
    """Create a new order"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Convert items to JSON
        items_json = json.dumps([item.dict() for item in order.items])
        total_items = sum(item.quantity for item in order.items)
        
        query = """
            INSERT INTO bestellungen (projekt_id, items, notes, total_items, status)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id, projekt_id, items, notes, total_items, status, created_at
        """
        
        cursor.execute(
            query,
            (
                order.projekt_id,
                items_json,
                order.notes,
                total_items,
                'pending'
            )
        )
        
        row = cursor.fetchone()
        conn.commit()
        
        columns = [desc[0] for desc in cursor.description]
        new_order = dict(zip(columns, row))
        
        # Convert timestamp to ISO format
        if new_order.get('created_at'):
            new_order['created_at'] = new_order['created_at'].isoformat()
        
        cursor.close()
        conn.close()
        
        return new_order
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create order: {str(e)}"
        )


@router.put("/{order_id}/status")
async def update_order_status(order_id: int, new_status: str):
    """Update order status (Admin only)"""
    valid_statuses = ['pending', 'approved', 'completed', 'cancelled']
    
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            "UPDATE bestellungen SET status = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s RETURNING id, status",
            (new_status, order_id)
        )
        
        row = cursor.fetchone()
        
        if not row:
            cursor.close()
            conn.close()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {"id": row[0], "status": row[1], "message": "Order status updated successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update order status: {str(e)}"
        )


