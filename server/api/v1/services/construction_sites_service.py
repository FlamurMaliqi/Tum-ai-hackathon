import logging
from typing import List, Dict
from psycopg2.extras import RealDictCursor
from ..data_access.database import get_db_connection

logger = logging.getLogger(__name__)

def get_all_construction_sites() -> List[Dict]:
    """
    Retrieve all construction sites from the database.
    
    Returns:
        List of construction site dictionaries
    """
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            query = """
                SELECT 
                    id,
                    name,
                    created_at,
                    updated_at
                FROM construction_sites
                ORDER BY name
            """
            cur.execute(query)
            sites = cur.fetchall()
            logger.info(f"Found {len(sites)} construction sites")
            # Convert RealDictRow to regular dict
            return [dict(row) for row in sites]
    finally:
        conn.close()

