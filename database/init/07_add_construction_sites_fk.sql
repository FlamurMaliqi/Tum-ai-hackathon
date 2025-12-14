-- Migration: Convert typische_baustelle to foreign key to construction_sites
-- This script handles both new databases (without typische_baustelle) and existing ones (with it)

-- Step 1: Insert mock construction sites (if not already inserted)
INSERT INTO construction_sites (name) VALUES 
    ('Hochbau'),
    ('tiefbau')
ON CONFLICT (name) DO NOTHING;

-- Step 2: Add new column for foreign key (temporarily nullable)
ALTER TABLE artikel 
ADD COLUMN IF NOT EXISTS construction_site_id INTEGER REFERENCES construction_sites(id);

-- Step 3: Check if typische_baustelle column exists and migrate if it does
DO $$
BEGIN
    -- Check if the old column exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'artikel' 
        AND column_name = 'typische_baustelle'
    ) THEN
        -- Map existing typische_baustelle values to construction_site_id
        UPDATE artikel 
        SET construction_site_id = (
            SELECT id FROM construction_sites 
            WHERE name = artikel.typische_baustelle
        )
        WHERE typische_baustelle IS NOT NULL;

        -- For articles with "Alle" or NULL, map to "tiefbau" (the renamed "Alle")
        UPDATE artikel 
        SET construction_site_id = (
            SELECT id FROM construction_sites 
            WHERE name = 'tiefbau'
        )
        WHERE (typische_baustelle = 'Alle' OR typische_baustelle IS NULL) 
        AND construction_site_id IS NULL;

        -- Drop old index and column
        DROP INDEX IF EXISTS idx_typische_baustelle;
        ALTER TABLE artikel DROP COLUMN IF EXISTS typische_baustelle;
    END IF;
END $$;

-- Step 4: For new databases, set default construction_site_id for articles that don't have one
UPDATE artikel 
SET construction_site_id = (
    SELECT id FROM construction_sites 
    WHERE name = 'tiefbau'
)
WHERE construction_site_id IS NULL;

-- Step 5: Create new index on foreign key
CREATE INDEX IF NOT EXISTS idx_artikel_construction_site ON artikel(construction_site_id);

