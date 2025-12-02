-- ========================================
-- FULL DATABASE RESET
-- ========================================
-- ⚠️  WARNING: Ini akan menghapus SEMUA data kecuali users dan plant_types!
-- Backup database terlebih dahulu!

-- ========================================
-- 1. HAPUS SEMUA DATA (Urutan penting untuk foreign key)
-- ========================================

-- Hapus data yang tidak memiliki foreign key dulu
DELETE FROM notifications;
DELETE FROM productivity_metrics;
DELETE FROM reminders;

-- Hapus data yang memiliki foreign key
DELETE FROM harvests;
DELETE FROM finances;
DELETE FROM maintenance;
DELETE FROM plants;
DELETE FROM lands;

-- ========================================
-- 2. RESET AUTO-INCREMENT KE 1
-- ========================================

-- Reset sequence untuk semua tabel
ALTER SEQUENCE plants_id_seq RESTART WITH 1;
ALTER SEQUENCE maintenance_id_seq RESTART WITH 1;
ALTER SEQUENCE harvests_id_seq RESTART WITH 1;
ALTER SEQUENCE finances_id_seq RESTART WITH 1;
ALTER SEQUENCE lands_id_seq RESTART WITH 1;
ALTER SEQUENCE notifications_id_seq RESTART WITH 1;
ALTER SEQUENCE reminders_id_seq RESTART WITH 1;
ALTER SEQUENCE productivity_metrics_id_seq RESTART WITH 1;

-- ========================================
-- 3. VERIFIKASI RESET
-- ========================================

-- Cek jumlah data (harusnya 0)
SELECT 
  'plants' as table_name, COUNT(*) as count FROM plants
UNION ALL
SELECT 
  'maintenance' as table_name, COUNT(*) as count FROM maintenance
UNION ALL
SELECT 
  'harvests' as table_name, COUNT(*) as count FROM harvests
UNION ALL
SELECT 
  'finances' as table_name, COUNT(*) as count FROM finances
UNION ALL
SELECT 
  'lands' as table_name, COUNT(*) as count FROM lands
UNION ALL
SELECT 
  'notifications' as table_name, COUNT(*) as count FROM notifications
UNION ALL
SELECT 
  'reminders' as table_name, COUNT(*) as count FROM reminders
UNION ALL
SELECT 
  'productivity_metrics' as table_name, COUNT(*) as count FROM productivity_metrics;

-- Cek next ID (harusnya 1)
SELECT 
  'plants' as table_name, nextval('plants_id_seq') as next_id
UNION ALL
SELECT 
  'maintenance' as table_name, nextval('maintenance_id_seq') as next_id
UNION ALL
SELECT 
  'harvests' as table_name, nextval('harvests_id_seq') as next_id
UNION ALL
SELECT 
  'finances' as table_name, nextval('finances_id_seq') as next_id
UNION ALL
SELECT 
  'lands' as table_name, nextval('lands_id_seq') as next_id
UNION ALL
SELECT 
  'notifications' as table_name, nextval('notifications_id_seq') as next_id
UNION ALL
SELECT 
  'reminders' as table_name, nextval('reminders_id_seq') as next_id
UNION ALL
SELECT 
  'productivity_metrics' as table_name, nextval('productivity_metrics_id_seq') as next_id;

-- ========================================
-- 4. CEK USERS DAN PLANT_TYPES (TIDAK DIHAPUS)
-- ========================================

-- Cek users yang tersimpan
SELECT id, username, email, created_at FROM users ORDER BY id;

-- Cek plant_types yang tersimpan
SELECT id, name, watering_interval, harvest_days FROM plant_types ORDER BY id;

-- ========================================
-- 5. ALTERNATIF: TRUNCATE (Lebih cepat)
-- ========================================
/*
-- Jika ingin menggunakan TRUNCATE (lebih cepat dan reset otomatis):
TRUNCATE TABLE 
  notifications, 
  productivity_metrics, 
  reminders, 
  harvests, 
  finances, 
  maintenance, 
  plants, 
  lands 
RESTART IDENTITY CASCADE;
*/

-- ========================================
-- 6. TEST INSERT (Setelah reset)
-- ========================================

-- Test insert untuk memastikan ID mulai dari 1
/*
-- Test insert plants
INSERT INTO plants (name, planting_date, status, notes, user_id, plant_type_id, estimated_harvest_date)
VALUES ('Test Plant', '2025-11-23', 'active', 'Test notes', 1, 1, '2025-11-23')
RETURNING id;

-- Test insert maintenance  
INSERT INTO maintenance (plant_id, type, date, notes, cost, user_id)
VALUES (1, 'watering', '2025-11-23', 'Test maintenance', 0, 1)
RETURNING id;

-- Test insert harvest
INSERT INTO harvests (plant_id, date, amount, pricePerKg, notes, user_id)
VALUES (1, '2025-11-23', 10, 5000, 'Test harvest', 1)
RETURNING id;

-- Test insert finance
INSERT INTO finances (type, category, amount, description, date, user_id, plant_id)
VALUES ('expense', 'watering', 10000, 'Test finance', '2025-11-23', 1, 1)
RETURNING id;

-- Test insert land
INSERT INTO lands (name, location, area_size, user_id)
VALUES ('Test Land', 'Test Location', 100, 1)
RETURNING id;

-- Test insert notification
INSERT INTO notifications (title, message, type, user_id)
VALUES ('Test Notification', 'Test message', 'info', 1)
RETURNING id;

-- Hapus test data setelah verifikasi
DELETE FROM notifications WHERE title = 'Test Notification';
DELETE FROM finances WHERE description = 'Test finance';
DELETE FROM harvests WHERE notes = 'Test harvest';
DELETE FROM maintenance WHERE notes = 'Test maintenance';
DELETE FROM plants WHERE name = 'Test Plant';
DELETE FROM lands WHERE name = 'Test Land';
*/

-- ========================================
-- SELESAI! Database sudah bersih dan siap digunakan
-- ========================================
