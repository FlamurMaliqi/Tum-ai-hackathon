"""
Predefined database queries intended to be wrapped as AI tools elsewhere.

Important:
- This module ONLY defines DB queries (no tool/wrapper logic).
- Uses the same Postgres/psycopg2 connection pattern as other services.
"""

from __future__ import annotations

from typing import Dict, List

from psycopg2.extras import RealDictCursor

from . import get_db_connection


def get_all_product_names() -> List[str]:
    """
    Retrieve all distinct product names from the `artikel` table (the table with prices).

    Returns a sorted list of product names.
    """
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT DISTINCT artikelname
                FROM artikel
                WHERE artikelname IS NOT NULL
                ORDER BY artikelname ASC
                """
            )
            rows = cur.fetchall()
            return [str(row["artikelname"]) for row in rows]
    finally:
        conn.close()


def get_product_prices_by_name_regex(name_regex: str) -> List[Dict]:
    """
    Retrieve products (including price) from `artikel` whose name matches a Postgres regex.

    Matching:
    - Uses case-insensitive regex operator `~*`.
    - Caller is responsible for providing a safe/appropriate regex pattern.
      (e.g. 'Handschuh' or '.*handschuh.*')
    """
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            sql = """
                SELECT
                    artikel_id,
                    artikelname,
                    kategorie,
                    einheit,
                    preis_eur,
                    lieferant,
                    verbrauchsart,
                    gefahrgut,
                    lagerort
                FROM artikel
                WHERE artikelname ~* %s
                ORDER BY preis_eur ASC NULLS LAST, artikelname ASC, artikel_id ASC
            """
            cur.execute(sql, (name_regex,))
            rows = cur.fetchall()
            return [dict(row) for row in rows]
    finally:
        conn.close()


def get_inventory_items_by_name_regex(name_regex: str) -> List[Dict]:
    """
    Retrieve inventory items from `inventory` whose name matches a Postgres regex.

    Matching:
    - Uses case-insensitive regex operator `~*`.
    """
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            sql = """
                SELECT
                    artikel_id,
                    artikelname,
                    kategorie,
                    lieferant
                FROM inventory
                WHERE artikelname ~* %s
                ORDER BY artikelname ASC, artikel_id ASC
            """
            cur.execute(sql, (name_regex,))
            rows = cur.fetchall()
            return [dict(row) for row in rows]
    finally:
        conn.close()

