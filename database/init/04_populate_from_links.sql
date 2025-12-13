-- Insert articles from links.json
-- Generated automatically from populate_artikel_from_links.py

INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, typische_baustelle)
VALUES ('W-MAGN-001', 'Magnetischer Bithalter', 'Werkzeug', 'Stk', NULL, 'Würth', 'Mehrweg', false, 'Container A', 'Alle')
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, typische_baustelle)
VALUES ('W-PORE-002', 'Porenbetondübel', 'Befestigung', 'Stk', NULL, 'Würth', 'Einweg', false, 'Container A', 'Hochbau')
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, typische_baustelle)
VALUES ('W-BOHR-003', 'Bohrhammer', 'Elektro', 'Stk', NULL, 'Würth', 'Mehrweg', false, 'Container A', 'Alle')
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, typische_baustelle)
VALUES ('W-SICH-004', 'Sicherheitsbrille', 'PSA', 'Stk', NULL, 'Würth', 'Mehrweg', false, 'Container A', 'Alle')
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, typische_baustelle)
VALUES ('W-KREI-005', 'Kreissägeblatt', 'Werkzeug', 'Stk', NULL, 'Würth', 'Mehrweg', false, 'Container A', 'Alle')
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, typische_baustelle)
VALUES ('W-EDEL-006', 'Edelstahlband', 'Material', 'm', NULL, 'Würth', 'Einweg', false, 'Container A', 'Alle')
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, typische_baustelle)
VALUES ('W-MESS-007', 'Messband', 'Werkzeug', 'Stk', NULL, 'Würth', 'Mehrweg', false, 'Container A', 'Alle')
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, typische_baustelle)
VALUES ('W-KABE-008', 'Kabelbinder', 'Befestigung', 'Stk', NULL, 'Würth', 'Einweg', false, 'Container A', 'Alle')
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, typische_baustelle)
VALUES ('W-SCHL-009', 'Schleifscheibe', 'Werkzeug', 'Stk', NULL, 'Würth', 'Mehrweg', false, 'Container A', 'Alle')
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, typische_baustelle)
VALUES ('H-MAGN-010', 'Magnetischer Bithalter', 'Werkzeug', 'Stk', NULL, 'Hilti', 'Mehrweg', false, 'Container A', 'Alle')
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, typische_baustelle)
VALUES ('H-PORE-011', 'Porenbetondübel', 'Befestigung', 'Stk', NULL, 'Hilti', 'Einweg', false, 'Container A', 'Hochbau')
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, typische_baustelle)
VALUES ('H-BOHR-012', 'Bohrhammer', 'Elektro', 'Stk', NULL, 'Hilti', 'Mehrweg', false, 'Container A', 'Alle')
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, typische_baustelle)
VALUES ('H-SICH-013', 'Sicherheitsbrille', 'PSA', 'Stk', NULL, 'Hilti', 'Mehrweg', false, 'Container A', 'Alle')
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, typische_baustelle)
VALUES ('H-KREI-014', 'Kreissägeblatt', 'Werkzeug', 'Stk', NULL, 'Hilti', 'Mehrweg', false, 'Container A', 'Alle')
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, typische_baustelle)
VALUES ('H-EDEL-015', 'Edelstahlband', 'Material', 'm', NULL, 'Hilti', 'Einweg', false, 'Container A', 'Alle')
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, typische_baustelle)
VALUES ('H-MESS-016', 'Messband', 'Werkzeug', 'Stk', NULL, 'Hilti', 'Mehrweg', false, 'Container A', 'Alle')
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, typische_baustelle)
VALUES ('H-SICH-017', 'Schutzbrille', 'PSA', 'Stk', NULL, 'Hilti', 'Mehrweg', false, 'Container A', 'Alle')
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, typische_baustelle)
VALUES ('H-KABE-018', 'Kabelbinder', 'Befestigung', 'Stk', NULL, 'Hilti', 'Einweg', false, 'Container A', 'Alle')
ON CONFLICT (artikel_id) DO NOTHING;
INSERT INTO artikel (artikel_id, artikelname, kategorie, einheit, preis_eur, lieferant, verbrauchsart, gefahrgut, lagerort, typische_baustelle)
VALUES ('H-SCHL-019', 'Schleifscheibe', 'Werkzeug', 'Stk', NULL, 'Hilti', 'Mehrweg', false, 'Container A', 'Alle')
ON CONFLICT (artikel_id) DO NOTHING;