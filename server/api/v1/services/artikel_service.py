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


def get_alternative_products(artikelname: str, exclude_artikel_id: Optional[str] = None) -> List[Dict]:
    """
    Find alternative products with the same name but different supplier.
    
    Args:
        artikelname: Product name to find alternatives for
        exclude_artikel_id: Optional artikel_id to exclude from results
    
    Returns:
        List of alternative article dictionaries
    """
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
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
                WHERE a.artikelname = %s
            """
            params = [artikelname]
            
            if exclude_artikel_id:
                query += " AND a.artikel_id != %s"
                params.append(exclude_artikel_id)
            
            query += " ORDER BY a.lieferant, a.artikel_id"
            
            cur.execute(query, params)
            alternatives = cur.fetchall()
            logger.info(f"Found {len(alternatives)} alternatives for {artikelname}")
            return [dict(row) for row in alternatives]
    finally:
        conn.close()
