-- Add estimated_harvest_date column to plants table
-- This column is used to store the calculated harvest date based on planting_date + harvest_days

ALTER TABLE plants ADD COLUMN IF NOT EXISTS estimated_harvest_date DATE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_plants_estimated_harvest_date ON plants(estimated_harvest_date);
