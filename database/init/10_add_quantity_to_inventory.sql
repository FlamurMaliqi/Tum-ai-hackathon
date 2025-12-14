-- Migration: Add quantity column to inventory table
-- This script can be run on existing databases to add the new column

ALTER TABLE inventory 
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 0;

-- Update existing records with default quantity if they don't have one
UPDATE inventory 
SET quantity = 0 
WHERE quantity IS NULL;
