-- Cek format yang dikirim backend ke frontend
-- Jalankan query ini untuk melihat exact format di database

-- 1. Cek format tanggal di database
SELECT 
  id,
  name,
  planting_date,
  estimated_harvest_date,
  typeof(planting_date) as planting_date_type,
  typeof(estimated_harvest_date) as harvest_date_type,
  to_char(planting_date, 'YYYY-MM-DD HH24:MI:SS') as planting_format,
  to_char(estimated_harvest_date, 'YYYY-MM-DD HH24:MI:SS') as harvest_format
FROM plants 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Cek timezone setting database
SHOW timezone;

-- 3. Cek current time dengan format berbeda
SELECT 
  NOW() as now_with_time,
  CURRENT_DATE as current_date,
  CURRENT_DATE::timestamp as current_date_timestamp,
  to_char(CURRENT_DATE, 'YYYY-MM-DD HH24:MI:SS') as current_date_formatted;

-- 4. Test casting ke timestamp
SELECT 
  '2025-11-23'::date as date_only,
  '2025-11-23'::timestamp as timestamp_default,
  '2025-11-23 00:00:00'::timestamp as timestamp_with_time;

-- 5. Cek apakah ada data dengan waktu spesifik
SELECT 
  planting_date,
  EXTRACT(HOUR FROM planting_date) as hour,
  EXTRACT(MINUTE FROM planting_date) as minute
FROM plants 
WHERE planting_date IS NOT NULL
LIMIT 5;

-- 6. Test insert dengan berbagai format
/*
INSERT INTO plants (name, planting_date, estimated_harvest_date, status, notes, user_id, plant_type_id) 
VALUES 
  ('TEST_DATE_ONLY', '2025-11-23', '2025-11-23', 'active', 'test date only', 1, 1),
  ('TEST_WITH_TIME', '2025-11-23 15:30:00', '2025-11-23 15:30:00', 'active', 'test with time', 1, 1)
RETURNING id, planting_date, estimated_harvest_date;
*/

-- 7. Cek hasil test insert
-- SELECT id, name, planting_date, estimated_harvest_date FROM plants WHERE name LIKE 'TEST_%';
