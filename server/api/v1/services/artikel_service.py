from typing import List, Dict
from psycopg2.extras import RealDictCursor
from ..data_access.database import get_db_connection

def get_all_artikel() -> List[Dict]:
    """Retrieve all articles from the database."""
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT 
                    artikel_id,
                    artikelname,
                    kategorie,
                    einheit,
                    preis_eur,
                    lieferant,
                    verbrauchsart,
                    gefahrgut,
                    lagerort,
                    typische_baustelle
                FROM artikel
                ORDER BY artikel_id
            """)
            articles = cur.fetchall()
            # Convert RealDictRow to regular dict
            return [dict(row) for row in articles]
    finally:
        conn.close()
