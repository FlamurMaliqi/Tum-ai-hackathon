-- Insert mock orders for testing
-- These orders will be created when the database is initialized

-- Order 1: Hans Müller / Bauprojekt Mitte (under 100€ - auto-approved)
INSERT INTO bestellungen (bestell_id, polier_name, projekt_name, gesamt_betrag, status, erstellt_von, erstellt_am)
VALUES ('ORD-001', 'Hans Müller', 'Bauprojekt Mitte', 45.50, 'approved', 'hans.mueller', CURRENT_TIMESTAMP - INTERVAL '5 days')
ON CONFLICT (bestell_id) DO NOTHING;

-- Order items for ORD-001 (only insert if order exists and items don't exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM bestellungen WHERE bestell_id = 'ORD-001') 
     AND NOT EXISTS (SELECT 1 FROM bestellpositionen WHERE bestell_id = 'ORD-001') THEN
    INSERT INTO bestellpositionen (bestell_id, artikel_id, artikel_name, menge, einheit, einzelpreis, gesamt_preis, position_nummer)
    VALUES 
      ('ORD-001', 'W-KABE-008', 'Kabelbinder', 50, 'Stk', 0.15, 7.50, 1),
      ('ORD-001', 'W-PORE-002', 'Porenbetondübel', 20, 'Stk', 0.85, 17.00, 2),
      ('ORD-001', 'W-MAGN-001', 'Magnetischer Bithalter', 5, 'Stk', 1.90, 9.50, 3),
      ('ORD-001', 'W-SCHL-009', 'Schleifscheibe', 3, 'Stk', 3.20, 9.60, 4),
      ('ORD-001', 'W-MESS-007', 'Messband', 1, 'Stk', 15.00, 15.00, 5);
  END IF;
END $$;

-- Order 2: Klaus Weber / Wohnanlage Nord (over 100€ - pending)
INSERT INTO bestellungen (bestell_id, polier_name, projekt_name, gesamt_betrag, status, erstellt_von, erstellt_am)
VALUES ('ORD-002', 'Klaus Weber', 'Wohnanlage Nord', 275.85, 'pending', 'klaus.weber', CURRENT_TIMESTAMP - INTERVAL '2 days')
ON CONFLICT (bestell_id) DO NOTHING;

-- Order items for ORD-002
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM bestellungen WHERE bestell_id = 'ORD-002') 
     AND NOT EXISTS (SELECT 1 FROM bestellpositionen WHERE bestell_id = 'ORD-002') THEN
    INSERT INTO bestellpositionen (bestell_id, artikel_id, artikel_name, menge, einheit, einzelpreis, gesamt_preis, position_nummer)
    VALUES 
      ('ORD-002', 'H-BOHR-012', 'Bohrhammer', 1, 'Stk', 250.00, 250.00, 1),
      ('ORD-002', 'H-SICH-013', 'Sicherheitsbrille', 2, 'Stk', 12.50, 25.00, 2),
      ('ORD-002', 'H-KREI-014', 'Kreissägeblatt', 1, 'Stk', 8.90, 8.90, 3);
  END IF;
END $$;

-- Order 3: Peter Schmidt / Bürogebäude Ost (under 100€ - approved, delivered)
INSERT INTO bestellungen (bestell_id, polier_name, projekt_name, gesamt_betrag, status, erstellt_von, genehmigt_von, genehmigt_am, erstellt_am)
VALUES ('ORD-003', 'Peter Schmidt', 'Bürogebäude Ost', 78.20, 'delivered', 'peter.schmidt', 'admin', CURRENT_TIMESTAMP - INTERVAL '7 days', CURRENT_TIMESTAMP - INTERVAL '8 days')
ON CONFLICT (bestell_id) DO NOTHING;

-- Order items for ORD-003
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM bestellungen WHERE bestell_id = 'ORD-003') 
     AND NOT EXISTS (SELECT 1 FROM bestellpositionen WHERE bestell_id = 'ORD-003') THEN
    INSERT INTO bestellpositionen (bestell_id, artikel_id, artikel_name, menge, einheit, einzelpreis, gesamt_preis, position_nummer)
    VALUES 
      ('ORD-003', 'W-EDEL-006', 'Edelstahlband', 10, 'm', 4.50, 45.00, 1),
      ('ORD-003', 'W-KABE-008', 'Kabelbinder', 100, 'Stk', 0.15, 15.00, 2),
      ('ORD-003', 'W-MAGN-001', 'Magnetischer Bithalter', 8, 'Stk', 1.90, 15.20, 3),
      ('ORD-003', 'W-PORE-002', 'Porenbetondübel', 3, 'Stk', 0.85, 2.55, 4),
      ('ORD-003', 'W-SCHL-009', 'Schleifscheibe', 1, 'Stk', 3.20, 3.20, 5);
  END IF;
END $$;

