-- Migration: Add construction_site column to inventory table
-- This script can be run on existing databases to add the new column

ALTER TABLE inventory 
ADD COLUMN IF NOT EXISTS construction_site VARCHAR(100);

-- Update existing records with default values
UPDATE inventory 
SET construction_site = 'Construction Site 1' 
WHERE construction_site IS NULL;

