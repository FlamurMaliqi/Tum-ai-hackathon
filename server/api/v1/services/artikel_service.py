import logging
from typing import List, Dict, Optional
from psycopg2.extras import RealDictCursor
from ..data_access.database import get_db_connection

logger = logging.getLogger(__name__)

def get_all_artikel(
    search: Optional[str] = None,
    category: Optional[str] = None
) -> List[Dict]:
    """
    Retrieve articles from the database with optional search and category filtering.
    
    Args:
        search: Optional search term to filter by artikelname or lieferant
        category: Optional category to filter by kategorie
    
    Returns:
        List of article dictionaries
    """
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Build query with optional filters
            query = """
                SELECT 
                    a.artikel_id,
                    a.artikelname,
                    a.kategorie,
                    a.einheit,
                    a.preis_eur,
                    a.lieferant,
                    a.verbrauchsart,
                    a.gefahrgut,
                    a.lagerort,
                    a.construction_site_id,
                    cs.name as construction_site_name
                FROM artikel a
                LEFT JOIN construction_sites cs ON a.construction_site_id = cs.id
                WHERE 1=1
            """
            params = []
            
            if search:
                query += " AND (LOWER(artikelname) LIKE LOWER(%s) OR LOWER(lieferant) LIKE LOWER(%s))"
                search_pattern = f"%{search}%"
                params.extend([search_pattern, search_pattern])
                logger.info(f"Adding search filter: {search_pattern}")
            
            if category:
                query += " AND kategorie = %s"
                params.append(category)
                logger.info(f"Adding category filter: {category}")
            
            query += " ORDER BY artikel_id"
            
            logger.info(f"Executing query with {len(params)} parameters")
            cur.execute(query, params)
            articles = cur.fetchall()
            logger.info(f"Found {len(articles)} articles")
            # Convert RealDictRow to regular dict
            return [dict(row) for row in articles]
    finally:
        conn.close()
