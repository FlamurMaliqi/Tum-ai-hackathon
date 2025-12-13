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
    lieferant VARCHAR(100)
);
