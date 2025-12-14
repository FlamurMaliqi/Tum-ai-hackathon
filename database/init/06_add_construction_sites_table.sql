-- Create construction_sites table
-- This table stores construction site information

CREATE TABLE IF NOT EXISTS construction_sites (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups by name
CREATE INDEX IF NOT EXISTS idx_construction_sites_name ON construction_sites(name);

-- Insert mock construction sites
INSERT INTO construction_sites (name) VALUES 
    ('Hochbau'),
    ('tiefbau')
ON CONFLICT (name) DO NOTHING;

