-- Populate inventory table with mock data from artikel table
-- This script inserts 4 sample inventory entries using products from the artikel table

INSERT INTO inventory (artikel_id, artikelname, kategorie, lieferant, construction_site, quantity)
SELECT 
    a.artikel_id,
    a.artikelname,
    a.kategorie,
    a.lieferant,
    cs.name AS construction_site,
    CASE 
        WHEN a.artikel_id = 'W-MAGN-001' THEN 15   -- Magnetischer Bithalter: 15 units
        WHEN a.artikel_id = 'W-PORE-002' THEN 50   -- Porenbetondübel: 50 units
        WHEN a.artikel_id = 'W-SICH-004' THEN 8    -- Sicherheitsbrille: 8 units
        WHEN a.artikel_id = 'H-BOHR-012' THEN 2    -- Bohrhammer: 2 units
        ELSE 0
    END AS quantity
FROM artikel a
LEFT JOIN construction_sites cs ON a.construction_site_id = cs.id
WHERE a.artikel_id IN (
    'W-MAGN-001',  -- Magnetischer Bithalter (Würth) - tiefbau
    'W-PORE-002',  -- Porenbetondübel (Würth) - Hochbau
    'W-SICH-004',  -- Sicherheitsbrille (Würth) - tiefbau
    'H-BOHR-012'   -- Bohrhammer (Hilti) - tiefbau
)
ON CONFLICT (artikel_id) DO NOTHING;
