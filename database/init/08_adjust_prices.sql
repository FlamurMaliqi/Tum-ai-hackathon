-- Adjust prices to make Hilti and Würth products have slightly different prices
-- Hilti products will be slightly more expensive (premium brand)
-- Würth products will be slightly cheaper

-- Bohrhammer: Hilti +5%, Würth -3%
UPDATE artikel SET preis_eur = 262.50 WHERE artikel_id = 'H-BOHR-012';
UPDATE artikel SET preis_eur = 242.50 WHERE artikel_id = 'W-BOHR-003';

-- Edelstahlband: Hilti +4%, Würth -2%
UPDATE artikel SET preis_eur = 4.68 WHERE artikel_id = 'H-EDEL-015';
UPDATE artikel SET preis_eur = 4.41 WHERE artikel_id = 'W-EDEL-006';

-- Kabelbinder: Hilti +3%, Würth -2%
UPDATE artikel SET preis_eur = 0.15 WHERE artikel_id = 'H-KABE-018'; -- Keep same (very small price)
UPDATE artikel SET preis_eur = 0.15 WHERE artikel_id = 'W-KABE-008'; -- Keep same (very small price)

-- Kreissägeblatt: Hilti +4%, Würth -3%
UPDATE artikel SET preis_eur = 9.26 WHERE artikel_id = 'H-KREI-014';
UPDATE artikel SET preis_eur = 8.63 WHERE artikel_id = 'W-KREI-005';

-- Magnetischer Bithalter: Hilti +3%, Würth -2%
UPDATE artikel SET preis_eur = 1.96 WHERE artikel_id = 'H-MAGN-010';
UPDATE artikel SET preis_eur = 1.86 WHERE artikel_id = 'W-MAGN-001';

-- Messband: Hilti +5%, Würth -3%
UPDATE artikel SET preis_eur = 15.75 WHERE artikel_id = 'H-MESS-016';
UPDATE artikel SET preis_eur = 14.55 WHERE artikel_id = 'W-MESS-007';

-- Porenbetondübel: Hilti +4%, Würth -2%
UPDATE artikel SET preis_eur = 0.88 WHERE artikel_id = 'H-PORE-011';
UPDATE artikel SET preis_eur = 0.83 WHERE artikel_id = 'W-PORE-002';

-- Schleifscheibe: Hilti +3%, Würth -2%
UPDATE artikel SET preis_eur = 3.30 WHERE artikel_id = 'H-SCHL-019';
UPDATE artikel SET preis_eur = 3.14 WHERE artikel_id = 'W-SCHL-009';

-- Sicherheitsbrille: Hilti +4%, Würth -3%
UPDATE artikel SET preis_eur = 13.00 WHERE artikel_id = 'H-SICH-013';
UPDATE artikel SET preis_eur = 12.13 WHERE artikel_id = 'W-SICH-004';
UPDATE artikel SET preis_eur = 13.00 WHERE artikel_id = 'H-SICH-017'; -- Schutzbrille (same as Sicherheitsbrille)

