-- Check latest plant creation
SELECT 
    id, 
    name, 
    planting_date, 
    estimated_harvest_date,
    plant_type_id,
    created_at,
    CASE 
        WHEN estimated_harvest_date IS NULL THEN 'NULL'
        ELSE 'HAS_VALUE'
    END as harvest_status
FROM plants 
ORDER BY created_at DESC 
LIMIT 5;

-- Check if there are any plants with estimated_harvest_date
SELECT 
    COUNT(*) as total_plants,
    COUNT(estimated_harvest_date) as with_harvest_date,
    COUNT(*) - COUNT(estimated_harvest_date) as null_harvest_date
FROM plants;
