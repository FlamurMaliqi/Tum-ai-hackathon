-- Migration script to add total_price column to existing bestellungen table
-- Run this if you already have the bestellungen table created

-- Add total_price column if it doesn't exist
ALTER TABLE bestellungen 
ADD COLUMN IF NOT EXISTS total_price DECIMAL(10, 2) DEFAULT 0.00;

-- Update existing orders to calculate total_price (if they have price in items JSONB)
-- This is optional - only if you want to backfill existing data
UPDATE bestellungen
SET total_price = (
    SELECT SUM((item->>'quantity')::int * (item->>'price')::decimal)
    FROM jsonb_array_elements(items) AS item
    WHERE item ? 'price' AND item ? 'quantity'
)
WHERE total_price = 0 OR total_price IS NULL;
