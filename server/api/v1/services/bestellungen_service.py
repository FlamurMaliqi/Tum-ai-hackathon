from typing import List, Dict, Optional
from psycopg2.extras import RealDictCursor
from ..data_access.database import get_db_connection
from ..services.artikel_service import get_alternative_products
from datetime import datetime
import uuid
import logging

logger = logging.getLogger(__name__)

def get_all_bestellungen_with_items() -> List[Dict]:
    """Retrieve all orders with their associated order items."""
    print("[DEBUG] get_all_bestellungen_with_items called", flush=True)
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # First, get all orders
            cur.execute("""
                SELECT 
                    bestell_id,
                    polier_name,
                    projekt_name,
                    gesamt_betrag,
                    status,
                    admin_notizen,
                    erstellt_am,
                    aktualisiert_am,
                    erstellt_von,
                    genehmigt_von,
                    genehmigt_am
                FROM bestellungen
                ORDER BY erstellt_am DESC
            """)
            orders = cur.fetchall()
            
            # Convert to list of dicts
            orders_list = [dict(row) for row in orders]
            
            # For each order, get its items and recalculate total
            for order in orders_list:
                cur.execute("""
                    SELECT 
                        position_id,
                        artikel_id,
                        artikel_name,
                        menge,
                        einheit,
                        einzelpreis,
                        gesamt_preis,
                        position_nummer,
                        notizen
                    FROM bestellpositionen
                    WHERE bestell_id = %s
                    ORDER BY position_nummer
                """, (order['bestell_id'],))
                
                items = cur.fetchall()
                items_list = []
                for item_row in items:
                    # Convert RealDictRow to regular dict to ensure mutability
                    item_dict = {}
                    for key, value in item_row.items():
                        # Convert Decimal/numeric types to float for JSON serialization
                        if hasattr(value, '__float__') and not isinstance(value, (int, float, str)):
                            item_dict[key] = float(str(value))
                        else:
                            item_dict[key] = value
                    items_list.append(item_dict)
                
                # Calculate total BEFORE adding alternatives (to ensure gesamt_preis is already converted)
                calculated_total = 0.0
                for item in items_list:
                    gesamt_preis = item.get('gesamt_preis', 0)
                    logger.info(f"Item {item.get('artikel_id')}: gesamt_preis = {gesamt_preis}, type = {type(gesamt_preis)}")
                    if isinstance(gesamt_preis, (int, float)):
                        calculated_total += float(gesamt_preis)
                        logger.info(f"Added {float(gesamt_preis)}, running total = {calculated_total}")
                    elif gesamt_preis is not None:
                        try:
                            price_val = float(str(gesamt_preis))
                            calculated_total += price_val
                            logger.info(f"Converted and added {price_val}, running total = {calculated_total}")
                        except (ValueError, TypeError) as e:
                            logger.warning(f"Could not convert gesamt_preis: {e}")
                
                # Add alternatives for each item (counterparts from different suppliers)
                for item in items_list:
                    artikel_name = item.get('artikel_name', '')
                    artikel_id = item.get('artikel_id', '')
                    item['alternatives'] = []  # Initialize empty list
                    try:
                        alternatives = get_alternative_products(artikel_name, artikel_id)
                        if alternatives:
                            item['alternatives'] = [
                                {
                                    'artikel_id': alt['artikel_id'],
                                    'artikel_name': alt['artikelname'],
                                    'lieferant': alt['lieferant'],
                                    'preis_eur': float(alt['preis_eur']) if alt['preis_eur'] else 0.0,
                                    'einheit': alt['einheit']
                                }
                                for alt in alternatives
                            ]
                    except Exception as e:
                        logger.error(f"Error fetching alternatives for {artikel_name}: {e}", exc_info=True)
                        # Keep empty list on error
                
                order['bestellpositionen'] = items_list
                
                # Use the calculated total (already computed above)
                order['gesamt_betrag'] = calculated_total
                logger.info(f"Order {order['bestell_id']}: Calculated total = {calculated_total}, Items count = {len(items_list)}")
            
            return orders_list
    finally:
        conn.close()


def create_bestellung(
    polier_name: str,
    projekt_name: str,
    items: List[Dict],
    erstellt_von: Optional[str] = None
) -> Dict:
    """
    Create a new order with order items.
    
    Args:
        polier_name: Foreman name
        projekt_name: Project name
        items: List of order items with artikel_id, artikel_name, menge, einheit, einzelpreis
        erstellt_von: Optional user who created the order
    
    Returns:
        Created order dictionary
    """
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Generate order ID
            bestell_id = f"ORD-{uuid.uuid4().hex[:8].upper()}"
            
            # Calculate total
            gesamt_betrag = sum(item['menge'] * item['einzelpreis'] for item in items)
            
            # Determine status (auto-approve if under 100€)
            status = 'approved' if gesamt_betrag < 100 else 'pending'
            
            # Insert order
            cur.execute("""
                INSERT INTO bestellungen (
                    bestell_id, polier_name, projekt_name, gesamt_betrag, 
                    status, erstellt_von
                )
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING *
            """, (bestell_id, polier_name, projekt_name, gesamt_betrag, status, erstellt_von))
            
            order = dict(cur.fetchone())
            conn.commit()
            
            # Insert order items
            for idx, item in enumerate(items, start=1):
                gesamt_preis = item['menge'] * item['einzelpreis']
                cur.execute("""
                    INSERT INTO bestellpositionen (
                        bestell_id, artikel_id, artikel_name, menge, einheit,
                        einzelpreis, gesamt_preis, position_nummer
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    bestell_id,
                    item['artikel_id'],
                    item['artikel_name'],
                    item['menge'],
                    item['einheit'],
                    item['einzelpreis'],
                    gesamt_preis,
                    idx
                ))
            
            conn.commit()
            
            # Fetch the complete order with items
            cur.execute("""
                SELECT * FROM bestellungen WHERE bestell_id = %s
            """, (bestell_id,))
            order = dict(cur.fetchone())
            
            cur.execute("""
                SELECT * FROM bestellpositionen 
                WHERE bestell_id = %s 
                ORDER BY position_nummer
            """, (bestell_id,))
            order['bestellpositionen'] = [dict(item) for item in cur.fetchall()]
            
            return order
    finally:
        conn.close()


def update_bestellung_status(
    bestell_id: str,
    new_status: str,
    genehmigt_von: Optional[str] = None,
    admin_notizen: Optional[str] = None
) -> Dict:
    """
    Update order status.
    
    Args:
        bestell_id: Order ID
        new_status: New status (pending, approved, rejected, delivered)
        genehmigt_von: Optional user who approved/rejected
        admin_notizen: Optional admin notes
    
    Returns:
        Updated order dictionary
    """
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Update order
            if new_status in ['approved', 'rejected']:
                cur.execute("""
                    UPDATE bestellungen 
                    SET status = %s, 
                        genehmigt_von = %s,
                        genehmigt_am = CURRENT_TIMESTAMP,
                        admin_notizen = COALESCE(%s, admin_notizen),
                        aktualisiert_am = CURRENT_TIMESTAMP
                    WHERE bestell_id = %s
                    RETURNING *
                """, (new_status, genehmigt_von, admin_notizen, bestell_id))
            else:
                cur.execute("""
                    UPDATE bestellungen 
                    SET status = %s,
                        admin_notizen = COALESCE(%s, admin_notizen),
                        aktualisiert_am = CURRENT_TIMESTAMP
                    WHERE bestell_id = %s
                    RETURNING *
                """, (new_status, admin_notizen, bestell_id))
            
            order = dict(cur.fetchone())
            conn.commit()
            
            # Fetch order items
            cur.execute("""
                SELECT * FROM bestellpositionen 
                WHERE bestell_id = %s 
                ORDER BY position_nummer
            """, (bestell_id,))
            items = cur.fetchall()
            items_list = []
            for item_row in items:
                # Convert RealDictRow to regular dict to ensure mutability
                item_dict = dict(item_row)
                items_list.append(item_dict)
            
            # Add alternatives for each item (counterparts from different suppliers)
            for item in items_list:
                try:
                    artikel_name = item.get('artikel_name', '')
                    artikel_id = item.get('artikel_id', '')
                    logger.info(f"Processing item: {artikel_name} (ID: {artikel_id})")
                    alternatives = get_alternative_products(artikel_name, artikel_id)
                    logger.info(f"Found {len(alternatives)} alternatives for {artikel_name} (excluding {artikel_id})")
                    item['alternatives'] = [
                        {
                            'artikel_id': alt['artikel_id'],
                            'artikel_name': alt['artikelname'],
                            'lieferant': alt['lieferant'],
                            'preis_eur': float(alt['preis_eur']) if alt['preis_eur'] else 0.0,
                            'einheit': alt['einheit']
                        }
                        for alt in alternatives
                    ]
                    logger.info(f"Added {len(item['alternatives'])} alternatives to item {artikel_name}")
                except Exception as e:
                    logger.error(f"Error fetching alternatives for {item.get('artikel_name', 'unknown')}: {e}", exc_info=True)
                    item['alternatives'] = []
            
            order['bestellpositionen'] = items_list
            
            # Recalculate total from items to ensure accuracy
            calculated_total = sum(
                float(item['gesamt_preis']) if isinstance(item['gesamt_preis'], (int, float, str)) 
                else 0.0 
                for item in items_list
            )
            order['gesamt_betrag'] = calculated_total
            
            return order
    finally:
        conn.close()

