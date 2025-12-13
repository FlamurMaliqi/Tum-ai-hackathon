from typing import List, Dict
from psycopg2.extras import RealDictCursor
from ..data_access.database import get_db_connection

def get_all_bestellungen_with_items() -> List[Dict]:
    """Retrieve all orders with their associated order items."""
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
            
            # For each order, get its items
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
                order['bestellpositionen'] = [dict(item) for item in items]
            
            return orders_list
    finally:
        conn.close()

