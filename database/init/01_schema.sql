-- Create the artikel table
CREATE TABLE IF NOT EXISTS artikel (
    artikel_id VARCHAR(50) PRIMARY KEY,
    artikelname VARCHAR(255) NOT NULL,
    kategorie VARCHAR(100),
    einheit VARCHAR(50),
    preis_eur DECIMAL(10, 2),
    lieferant VARCHAR(100),
    verbrauchsart VARCHAR(50),
    gefahrgut BOOLEAN DEFAULT FALSE,
    lagerort VARCHAR(100),
    typische_baustelle VARCHAR(100)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_kategorie ON artikel(kategorie);
CREATE INDEX IF NOT EXISTS idx_lagerort ON artikel(lagerort);
CREATE INDEX IF NOT EXISTS idx_typische_baustelle ON artikel(typische_baustelle);

-- Create the inventory table
CREATE TABLE IF NOT EXISTS inventory (
    artikel_id VARCHAR(50) PRIMARY KEY,
    artikelname VARCHAR(255) NOT NULL,
    kategorie VARCHAR(100),
    lieferant VARCHAR(100),
    construction_site VARCHAR(100)
);

-- Create the bestellungen (Orders) table
CREATE TABLE IF NOT EXISTS bestellungen (
    -- Primary identification
    bestell_id VARCHAR(50) PRIMARY KEY,
    
    -- Order metadata
    polier_name VARCHAR(255) NOT NULL,           -- Foreman name (e.g., "Hans Müller")
    projekt_name VARCHAR(255) NOT NULL,          -- Project name (e.g., "Bauprojekt Mitte")
    
    -- Financial
    gesamt_betrag DECIMAL(10, 2) NOT NULL,       -- Total amount in EUR
    
    -- Status tracking
    status VARCHAR(50) NOT NULL DEFAULT 'pending',  -- pending, approved, rejected, delivered
    admin_notizen TEXT,                           -- Admin notes/comments
    
    -- Timestamps
    erstellt_am TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    aktualisiert_am TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Optional: User tracking
    erstellt_von VARCHAR(100),                    -- User who created the order
    genehmigt_von VARCHAR(100),                   -- Admin who approved/rejected
    genehmigt_am TIMESTAMP                        -- When it was approved
);

-- Indexes for bestellungen
CREATE INDEX IF NOT EXISTS idx_bestellungen_status ON bestellungen(status);
CREATE INDEX IF NOT EXISTS idx_bestellungen_polier ON bestellungen(polier_name);
CREATE INDEX IF NOT EXISTS idx_bestellungen_projekt ON bestellungen(projekt_name);
CREATE INDEX IF NOT EXISTS idx_bestellungen_datum ON bestellungen(erstellt_am DESC);

-- Create the bestellpositionen (Order Items) table
CREATE TABLE IF NOT EXISTS bestellpositionen (
    -- Primary key
    position_id SERIAL PRIMARY KEY,
    
    -- Foreign key to orders
    bestell_id VARCHAR(50) NOT NULL REFERENCES bestellungen(bestell_id) ON DELETE CASCADE,
    
    -- Product reference
    artikel_id VARCHAR(50) NOT NULL REFERENCES artikel(artikel_id),
    artikel_name VARCHAR(255) NOT NULL,          -- Denormalized for historical tracking
    
    -- Quantity and pricing
    menge INT NOT NULL CHECK (menge > 0),
    einheit VARCHAR(50) NOT NULL,
    einzelpreis DECIMAL(10, 2) NOT NULL,
    gesamt_preis DECIMAL(10, 2) NOT NULL,        -- menge * einzelpreis
    
    -- Metadata
    position_nummer INT NOT NULL,                 -- Order within the order (1, 2, 3...)
    notizen TEXT                                  -- Notes specific to this line item
);

-- Indexes for bestellpositionen
CREATE INDEX IF NOT EXISTS idx_bestellpositionen_bestell ON bestellpositionen(bestell_id);
CREATE INDEX IF NOT EXISTS idx_bestellpositionen_artikel ON bestellpositionen(artikel_id);
