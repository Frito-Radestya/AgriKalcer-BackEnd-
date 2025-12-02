-- Check if plants table exists and has data
SELECT 
    'plants' as table_name,
    COUNT(*) as record_count
FROM plants

UNION ALL

SELECT 
    'plant_types' as table_name,
    COUNT(*) as record_count
FROM plant_types

UNION ALL

SELECT 
    'users' as table_name,
    COUNT(*) as record_count
FROM users

UNION ALL

SELECT 
    'lands' as table_name,
    COUNT(*) as record_count
FROM lands;

-- Check plants table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'plants' 
AND table_schema = 'public'
ORDER BY ordinal_position;
