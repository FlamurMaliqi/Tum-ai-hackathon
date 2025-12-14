-- Insert articles from links.json
-- Generated automatically from populate_artikel_from_links.py
-- Updated to use construction_site_id instead of typische_baustelle

INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, construction_site_id)
VALUES ('W-MAGN-001', 'Magnetischer Bithalter', 'Werkzeug', 'Stk', 1.90, 'Würth', 'Mehrweg', false, 'Container A', (SELECT id FROM construction_sites WHERE name = 'tiefbau'))
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, construction_site_id)
VALUES ('W-PORE-002', 'Porenbetondübel', 'Befestigung', 'Stk', 0.85, 'Würth', 'Einweg', false, 'Container A', (SELECT id FROM construction_sites WHERE name = 'Hochbau'))
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, construction_site_id)
VALUES ('W-BOHR-003', 'Bohrhammer', 'Elektro', 'Stk', 250.00, 'Würth', 'Mehrweg', false, 'Container A', (SELECT id FROM construction_sites WHERE name = 'tiefbau'))
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, construction_site_id)
VALUES ('W-SICH-004', 'Sicherheitsbrille', 'PSA', 'Stk', 12.50, 'Würth', 'Mehrweg', false, 'Container A', (SELECT id FROM construction_sites WHERE name = 'tiefbau'))
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, construction_site_id)
VALUES ('W-KREI-005', 'Kreissägeblatt', 'Werkzeug', 'Stk', 8.90, 'Würth', 'Mehrweg', false, 'Container A', (SELECT id FROM construction_sites WHERE name = 'tiefbau'))
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, construction_site_id)
VALUES ('W-EDEL-006', 'Edelstahlband', 'Material', 'm', 4.50, 'Würth', 'Einweg', false, 'Container A', (SELECT id FROM construction_sites WHERE name = 'tiefbau'))
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, construction_site_id)
VALUES ('W-MESS-007', 'Messband', 'Werkzeug', 'Stk', 15.00, 'Würth', 'Mehrweg', false, 'Container A', (SELECT id FROM construction_sites WHERE name = 'tiefbau'))
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, construction_site_id)
VALUES ('W-KABE-008', 'Kabelbinder', 'Befestigung', 'Stk', 0.15, 'Würth', 'Einweg', false, 'Container A', (SELECT id FROM construction_sites WHERE name = 'tiefbau'))
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, construction_site_id)
VALUES ('W-SCHL-009', 'Schleifscheibe', 'Werkzeug', 'Stk', 3.20, 'Würth', 'Mehrweg', false, 'Container A', (SELECT id FROM construction_sites WHERE name = 'tiefbau'))
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, construction_site_id)
VALUES ('H-MAGN-010', 'Magnetischer Bithalter', 'Werkzeug', 'Stk', 1.90, 'Hilti', 'Mehrweg', false, 'Container A', (SELECT id FROM construction_sites WHERE name = 'tiefbau'))
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, construction_site_id)
VALUES ('H-PORE-011', 'Porenbetondübel', 'Befestigung', 'Stk', 0.85, 'Hilti', 'Einweg', false, 'Container A', (SELECT id FROM construction_sites WHERE name = 'Hochbau'))
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, construction_site_id)
VALUES ('H-BOHR-012', 'Bohrhammer', 'Elektro', 'Stk', 250.00, 'Hilti', 'Mehrweg', false, 'Container A', (SELECT id FROM construction_sites WHERE name = 'tiefbau'))
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, construction_site_id)
VALUES ('H-SICH-013', 'Sicherheitsbrille', 'PSA', 'Stk', 12.50, 'Hilti', 'Mehrweg', false, 'Container A', (SELECT id FROM construction_sites WHERE name = 'tiefbau'))
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, construction_site_id)
VALUES ('H-KREI-014', 'Kreissägeblatt', 'Werkzeug', 'Stk', 8.90, 'Hilti', 'Mehrweg', false, 'Container A', (SELECT id FROM construction_sites WHERE name = 'tiefbau'))
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, construction_site_id)
VALUES ('H-EDEL-015', 'Edelstahlband', 'Material', 'm', 4.50, 'Hilti', 'Einweg', false, 'Container A', (SELECT id FROM construction_sites WHERE name = 'tiefbau'))
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, construction_site_id)
VALUES ('H-MESS-016', 'Messband', 'Werkzeug', 'Stk', 15.00, 'Hilti', 'Mehrweg', false, 'Container A', (SELECT id FROM construction_sites WHERE name = 'tiefbau'))
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, construction_site_id)
VALUES ('H-SICH-017', 'Schutzbrille', 'PSA', 'Stk', 12.50, 'Hilti', 'Mehrweg', false, 'Container A', (SELECT id FROM construction_sites WHERE name = 'tiefbau'))
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, construction_site_id)
VALUES ('H-KABE-018', 'Kabelbinder', 'Befestigung', 'Stk', 0.15, 'Hilti', 'Einweg', false, 'Container A', (SELECT id FROM construction_sites WHERE name = 'tiefbau'))
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, construction_site_id)
VALUES ('H-SCHL-019', 'Schleifscheibe', 'Werkzeug', 'Stk', 3.20, 'Hilti', 'Mehrweg', false, 'Container A', (SELECT id FROM construction_sites WHERE name = 'tiefbau'))
ON CONFLICT (artikel_id) DO NOTHING;