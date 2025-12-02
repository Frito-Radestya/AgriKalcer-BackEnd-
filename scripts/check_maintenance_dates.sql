-- Check maintenance dates yang mungkin invalid
-- Jalankan query ini untuk melihat data maintenance

-- 1. Cek semua maintenance data
SELECT 
  id,
  plant_id,
  type,
  date,
  description,
  cost,
  notes,
  created_at,
  updated_at
FROM maintenance 
ORDER BY created_at DESC;

-- 2. Cek maintenance dengan tanggal null/invalid
SELECT 
  id,
  type,
  date,
  description,
  CASE 
    WHEN date IS NULL THEN 'NULL'
    WHEN date = '' THEN 'EMPTY'
    WHEN date = '0000-00-00' THEN 'ZERO DATE'
    WHEN date < '1900-01-01' THEN 'TOO OLD'
    WHEN date > '2100-12-31' THEN 'TOO FUTURE'
    ELSE 'OK'
  END as date_status
FROM maintenance 
WHERE date IS NULL 
   OR date = '' 
   OR date = '0000-00-00'
   OR date < '1900-01-01'
   OR date > '2100-12-31';

-- 3. Cek maintenance dengan format tanggal yang aneh
SELECT 
  id,
  type,
  date,
  LENGTH(date) as date_length,
  SUBSTRING(date, 1, 10) as date_prefix
FROM maintenance 
WHERE date IS NOT NULL 
  AND (
    LENGTH(date) != 10 
    OR date !~ '^\d{4}-\d{2}-\d{2}$'
  );

-- 4. Test insert dengan tanggal yang valid
/*
INSERT INTO maintenance (
  plant_id, type, date, description, cost, notes, user_id
) VALUES (
  1, 'watering', '2025-11-23', 'Test maintenance dengan tanggal valid', 0, 'Test notes', 1
) RETURNING id, date;
*/

-- 5. Update maintenance dengan tanggal null (jika ada data invalid)
/*
UPDATE maintenance 
SET date = '2025-11-23' 
WHERE date IS NULL OR date = '' OR date = '0000-00-00';
*/
