-- Check current status of estimated_harvest_date
SELECT 
    COUNT(*) as total_plants,
    COUNT(estimated_harvest_date) as plants_with_harvest_date,
    COUNT(*) - COUNT(estimated_harvest_date) as still_null,
    ROUND(COUNT(estimated_harvest_date) * 100.0 / COUNT(*), 2) as percentage_filled
FROM plants;

-- Show sample of plants with null estimated_harvest_date
SELECT id, name, planting_date, plant_type_id, estimated_harvest_date
FROM plants 
WHERE estimated_harvest_date IS NULL 
LIMIT 5;
