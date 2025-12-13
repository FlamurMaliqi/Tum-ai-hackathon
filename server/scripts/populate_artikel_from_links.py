#!/usr/bin/env python3
"""
Script to populate the artikel table from links.json
Reads the links.json file and generates SQL INSERT statements
"""

import json
import os
from pathlib import Path

# Product name to category mapping
PRODUCT_CATEGORIES = {
    "Magnetischer Bithalter": "Werkzeug",
    "Porenbetondübel": "Befestigung",
    "Bohrhammer": "Elektro",
    "Sicherheitsbrille": "PSA",
    "Schutzbrille": "PSA",  # Same as Sicherheitsbrille
    "Kreissägeblatt": "Werkzeug",
    "Edelstahlband": "Material",
    "Messband": "Werkzeug",
    "Kabelbinder": "Befestigung",
    "Schleifscheibe": "Werkzeug",
}

# Product name to unit mapping
PRODUCT_UNITS = {
    "Magnetischer Bithalter": "Stk",
    "Porenbetondübel": "Stk",
    "Bohrhammer": "Stk",
    "Sicherheitsbrille": "Stk",
    "Schutzbrille": "Stk",
    "Kreissägeblatt": "Stk",
    "Edelstahlband": "m",
    "Messband": "Stk",
    "Kabelbinder": "Stk",
    "Schleifscheibe": "Stk",
}

# Product name to consumption type mapping
PRODUCT_VERBRAUCHSART = {
    "Magnetischer Bithalter": "Mehrweg",
    "Porenbetondübel": "Einweg",
    "Bohrhammer": "Mehrweg",
    "Sicherheitsbrille": "Mehrweg",
    "Schutzbrille": "Mehrweg",
    "Kreissägeblatt": "Mehrweg",
    "Edelstahlband": "Einweg",
    "Messband": "Mehrweg",
    "Kabelbinder": "Einweg",
    "Schleifscheibe": "Mehrweg",
}

# Product name to typical construction site mapping
PRODUCT_BAUSTELLE = {
    "Magnetischer Bithalter": "Alle",
    "Porenbetondübel": "Hochbau",
    "Bohrhammer": "Alle",
    "Sicherheitsbrille": "Alle",
    "Schutzbrille": "Alle",
    "Kreissägeblatt": "Alle",
    "Edelstahlband": "Alle",
    "Messband": "Alle",
    "Kabelbinder": "Alle",
    "Schleifscheibe": "Alle",
}

# Product name to price mapping (example prices in EUR)
PRODUCT_PRICES = {
    "Magnetischer Bithalter": 1.90,
    "Porenbetondübel": 0.85,
    "Bohrhammer": 250.00,
    "Sicherheitsbrille": 12.50,
    "Schutzbrille": 12.50,
    "Kreissägeblatt": 8.90,
    "Edelstahlband": 4.50,
    "Messband": 15.00,
    "Kabelbinder": 0.15,
    "Schleifscheibe": 3.20,
}

def generate_artikel_id(supplier: str, product_name: str, index: int) -> str:
    """Generate a unique artikel_id for a product from a supplier."""
    # Create a short prefix from supplier (W for Würth, H for Hilti)
    prefix = "W" if supplier == "Würth" else "H"
    
    # Create a short code from product name (first 3-4 letters)
    product_code = product_name[:4].upper().replace("Ä", "A").replace("Ö", "O").replace("Ü", "U")
    product_code = ''.join(c for c in product_code if c.isalnum())
    
    # Format: W-BITH-001 or H-BITH-001
    return f"{prefix}-{product_code}-{index:03d}"


def main():
    # Get the project root directory (parent of server/)
    script_dir = Path(__file__).parent
    project_root = script_dir.parent.parent
    links_file = project_root / "links.json"
    
    if not links_file.exists():
        print(f"Error: {links_file} not found!")
        return
    
    # Read links.json
    with open(links_file, 'r', encoding='utf-8') as f:
        links_data = json.load(f)
    
    # Generate SQL INSERT statements
    sql_statements = []
    sql_statements.append("-- Insert articles from links.json")
    sql_statements.append("-- Generated automatically from populate_artikel_from_links.py")
    sql_statements.append("")
    
    index = 1
    
    # Process each supplier
    for supplier, products in links_data.items():
        for product_name, urls in products.items():
            # Normalize product name (Sicherheitsbrille and Schutzbrille are the same)
            normalized_name = "Sicherheitsbrille" if product_name == "Schutzbrille" else product_name
            
            artikel_id = generate_artikel_id(supplier, normalized_name, index)
            kategorie = PRODUCT_CATEGORIES.get(normalized_name, "Sonstiges")
            einheit = PRODUCT_UNITS.get(normalized_name, "Stk")
            verbrauchsart = PRODUCT_VERBRAUCHSART.get(normalized_name, "Einweg")
            typische_baustelle = PRODUCT_BAUSTELLE.get(normalized_name, "Alle")
            
            # Get price from mapping, or use NULL if not available
            preis_value = PRODUCT_PRICES.get(normalized_name)
            preis_eur = str(preis_value) if preis_value is not None else "NULL"
            
            lagerort = "'Container A'"  # Default storage location
            gefahrgut = "false"  # Assume not hazardous
            
            sql = f"""INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, typische_baustelle)
VALUES ('{artikel_id}', '{product_name}', '{kategorie}', '{einheit}', {preis_eur}, '{supplier}', '{verbrauchsart}', {gefahrgut}, {lagerort}, '{typische_baustelle}')
ON CONFLICT (artikel_id) DO NOTHING;"""
            
            sql_statements.append(sql)
            index += 1
    
    # Write to SQL file
    output_file = project_root / "database" / "init" / "04_populate_from_links.sql"
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_statements))
    
    print(f"Generated {len(sql_statements) - 3} INSERT statements")
    print(f"SQL file written to: {output_file}")
    print(f"\nTo apply these changes, run the SQL file against your database.")


if __name__ == "__main__":
    main()

