-- Create Bauprojekte (Construction Projects) table
CREATE TABLE IF NOT EXISTS bauprojekte (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Bestellungen (Orders) table
CREATE TABLE IF NOT EXISTS bestellungen (
    id SERIAL PRIMARY KEY,
    projekt_id INTEGER REFERENCES bauprojekte(id) ON DELETE SET NULL,
    items JSONB NOT NULL,
    notes TEXT,
    total_items INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster projekt lookups
CREATE INDEX IF NOT EXISTS idx_bestellungen_projekt ON bestellungen(projekt_id);
CREATE INDEX IF NOT EXISTS idx_bestellungen_status ON bestellungen(status);
CREATE INDEX IF NOT EXISTS idx_bauprojekte_status ON bauprojekte(status);

-- Insert some sample projects
INSERT INTO bauprojekte (name, description, location, start_date, status)
VALUES 
    ('Neubau Bürogebäude', 'Modernes Bürogebäude mit 5 Etagen', 'München Hauptstraße 123', '2024-01-15', 'active'),
    ('Renovierung Altbau', 'Sanierung eines historischen Gebäudes', 'Berlin Mitte', '2024-02-01', 'active'),
    ('Brückenbau A7', 'Neue Autobahnbrücke über die A7', 'Hamburg Nord', '2023-11-01', 'active')
ON CONFLICT DO NOTHING;
