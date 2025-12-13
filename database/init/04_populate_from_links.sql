-- Insert articles from links.json
-- Generated automatically from populate_artikel_from_links.py

INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, typische_baustelle)
VALUES ('W-MAGN-001', 'Magnetischer Bithalter', 'Werkzeug', 'Stk', 1.90, 'Würth', 'Mehrweg', false, 'Container A', 'Alle')
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, typische_baustelle)
VALUES ('W-PORE-002', 'Porenbetondübel', 'Befestigung', 'Stk', 0.85, 'Würth', 'Einweg', false, 'Container A', 'Hochbau')
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, typische_baustelle)
VALUES ('W-BOHR-003', 'Bohrhammer', 'Elektro', 'Stk', 250.00, 'Würth', 'Mehrweg', false, 'Container A', 'Alle')
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, typische_baustelle)
VALUES ('W-SICH-004', 'Sicherheitsbrille', 'PSA', 'Stk', 12.50, 'Würth', 'Mehrweg', false, 'Container A', 'Alle')
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, typische_baustelle)
VALUES ('W-KREI-005', 'Kreissägeblatt', 'Werkzeug', 'Stk', 8.90, 'Würth', 'Mehrweg', false, 'Container A', 'Alle')
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, typische_baustelle)
VALUES ('W-EDEL-006', 'Edelstahlband', 'Material', 'm', 4.50, 'Würth', 'Einweg', false, 'Container A', 'Alle')
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, typische_baustelle)
VALUES ('W-MESS-007', 'Messband', 'Werkzeug', 'Stk', 15.00, 'Würth', 'Mehrweg', false, 'Container A', 'Alle')
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, typische_baustelle)
VALUES ('W-KABE-008', 'Kabelbinder', 'Befestigung', 'Stk', 0.15, 'Würth', 'Einweg', false, 'Container A', 'Alle')
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, typische_baustelle)
VALUES ('W-SCHL-009', 'Schleifscheibe', 'Werkzeug', 'Stk', 3.20, 'Würth', 'Mehrweg', false, 'Container A', 'Alle')
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, typische_baustelle)
VALUES ('H-MAGN-010', 'Magnetischer Bithalter', 'Werkzeug', 'Stk', 1.90, 'Hilti', 'Mehrweg', false, 'Container A', 'Alle')
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, typische_baustelle)
VALUES ('H-PORE-011', 'Porenbetondübel', 'Befestigung', 'Stk', 0.85, 'Hilti', 'Einweg', false, 'Container A', 'Hochbau')
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, typische_baustelle)
VALUES ('H-BOHR-012', 'Bohrhammer', 'Elektro', 'Stk', 250.00, 'Hilti', 'Mehrweg', false, 'Container A', 'Alle')
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, typische_baustelle)
VALUES ('H-SICH-013', 'Sicherheitsbrille', 'PSA', 'Stk', 12.50, 'Hilti', 'Mehrweg', false, 'Container A', 'Alle')
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, typische_baustelle)
VALUES ('H-KREI-014', 'Kreissägeblatt', 'Werkzeug', 'Stk', 8.90, 'Hilti', 'Mehrweg', false, 'Container A', 'Alle')
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, typische_baustelle)
VALUES ('H-EDEL-015', 'Edelstahlband', 'Material', 'm', 4.50, 'Hilti', 'Einweg', false, 'Container A', 'Alle')
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, typische_baustelle)
VALUES ('H-MESS-016', 'Messband', 'Werkzeug', 'Stk', 15.00, 'Hilti', 'Mehrweg', false, 'Container A', 'Alle')
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, typische_baustelle)
VALUES ('H-SICH-017', 'Schutzbrille', 'PSA', 'Stk', 12.50, 'Hilti', 'Mehrweg', false, 'Container A', 'Alle')
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, typische_baustelle)
VALUES ('H-KABE-018', 'Kabelbinder', 'Befestigung', 'Stk', 0.15, 'Hilti', 'Einweg', false, 'Container A', 'Alle')
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, typische_baustelle)
VALUES ('H-SCHL-019', 'Schleifscheibe', 'Werkzeug', 'Stk', 3.20, 'Hilti', 'Mehrweg', false, 'Container A', 'Alle')
ON CONFLICT (artikel_id) DO NOTHING;