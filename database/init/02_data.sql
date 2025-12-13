-- Insert 5 sample articles from the CSV
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, typische_baustelle)
VALUES
    ('C001', 'Schraube TX20 4x40', 'Befestigung', 'Stk', 0.08, 'Würth', 'Einweg', false, 'Container A', 'Hochbau'),
    ('C004', 'Dübel 6mm', 'Kunststoff', 'Stk', 0.10, 'Fischer', 'Einweg', false, 'Container A', 'Innenausbau'),
    ('C019', 'Arbeitshandschuhe Gr.9', 'PSA', 'Paar', 2.50, 'Uvex', 'Einweg', false, 'PSA-Schrank', 'Alle'),
    ('C029', 'Markierspray rot', 'Farbe', 'Dose', 7.20, 'Soppec', 'Einweg', true, 'Farblager', 'Tiefbau'),
    ('C056', 'Baustellenlampe LED', 'Elektro', 'Stk', 29.00, 'Brennenstuhl', 'Mehrweg', false, 'Elektrolager', 'Alle')
ON CONFLICT (artikel_id) DO NOTHING;

-- Insert mock inventory entries
INSERT INTO inventory (artikel_id, artikelname, kategorie, lieferant, construction_site)
VALUES
    ('C001', 'Schraube TX20 4x40', 'Befestigung', 'Würth', 'Construction Site 1'),
    ('C019', 'Arbeitshandschuhe Gr.9', 'PSA', 'Uvex', 'Construction Site 2'),
    ('C056', 'Baustellenlampe LED', 'Elektro', 'Brennenstuhl', 'Construction Site 1')
ON CONFLICT (artikel_id) DO NOTHING;
