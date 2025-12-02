-- Script to update estimated_harvest_date for existing plants
-- Run this to fix null values in estimated_harvest_date column

-- Update plants that have estimated_harvest_date = NULL
UPDATE plants 
SET estimated_harvest_date = planting_date + (
    SELECT COALESCE(harvest_days, 60) 
    FROM plant_types 
    WHERE plant_types.id = plants.plant_type_id
) 
WHERE estimated_harvest_date IS NULL;

-- For plants without plant_type_id, use default 60 days
UPDATE plants 
SET estimated_harvest_date = planting_date + INTERVAL '60 days'
WHERE estimated_harvest_date IS NULL 
AND plant_type_id IS NULL;

-- Check results
SELECT COUNT(*) as total_plants, 
       COUNT(estimated_harvest_date) as plants_with_harvest_date,
       COUNT(*) - COUNT(estimated_harvest_date) as still_null
FROM plants;
