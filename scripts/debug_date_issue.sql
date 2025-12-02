-- Debug date issue - Cek apa yang tersimpan di backend
-- Jalankan query ini untuk melihat data aktual di database

-- 1. Cek data plants yang ada
SELECT 
  id,
  name,
  planting_date,
  estimated_harvest_date,
  status,
  created_at,
  updated_at
FROM plants 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Cek timezone database
SELECT name, setting FROM pg_settings WHERE name = 'timezone';

-- 3. Cek current time di database
SELECT NOW() as database_now;
SELECT CURRENT_DATE as database_current_date;
SELECT CURRENT_TIMESTAMP as database_timestamp;

-- 4. Test insert dengan tanggal spesifik
-- ( Uncomment untuk test )
/*
INSERT INTO plants (
  name, 
  planting_date, 
  estimated_harvest_date, 
  status, 
  notes, 
  user_id, 
  plant_type_id
) VALUES (
  'DEBUG_TEST_PLANT',
  '2025-11-23',
  '2025-11-23',
  'active',
  'Debug test plant',
  1,
  1
) RETURNING id, planting_date, estimated_harvest_date, created_at;
*/

-- 5. Cek hasil test insert
-- SELECT * FROM plants WHERE name = 'DEBUG_TEST_PLANT';

-- 6. Hapus test data
-- DELETE FROM plants WHERE name = 'DEBUG_TEST_PLANT';

-- 7. Cek format tanggal yang dikirim frontend (simulasi)
SELECT '2025-11-23'::date as parsed_date;
SELECT '2025-11-23'::timestamp as parsed_timestamp;
