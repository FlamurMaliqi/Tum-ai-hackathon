from typing import List, Dict
from psycopg2.extras import RealDictCursor
from ..data_access.database import get_db_connection

def get_all_inventory() -> List[Dict]:
    """Retrieve all inventory items from the database."""
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT 
                    artikel_id,
                    artikelname,
                    kategorie,
                    lieferant,
                    construction_site
                FROM inventory
                ORDER BY artikel_id
            """)
            items = cur.fetchall()
            # Convert RealDictRow to regular dict
            return [dict(row) for row in items]
    finally:
        conn.close()
