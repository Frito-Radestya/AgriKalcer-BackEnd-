-- ========================================
-- DATABASE CLEANUP SCRIPTS
-- ========================================
-- Gunakan dengan hati-hati! Backup database terlebih dahulu

-- ----------------------------------------
-- 1. Hapus semua data tanaman (plants)
-- ----------------------------------------
-- DELETE FROM plants;
-- Atau hapus berdasarkan user tertentu:
-- DELETE FROM plants WHERE user_id = [USER_ID];

-- ----------------------------------------
-- 2. Hapus semua data perawatan (maintenance)
-- ----------------------------------------
-- DELETE FROM maintenance;
-- Atau berdasarkan user:
-- DELETE FROM maintenance WHERE user_id = [USER_ID];

-- ----------------------------------------
-- 3. Hapus semua data panen (harvests)
-- ----------------------------------------
-- DELETE FROM harvests;
-- Atau berdasarkan user:
-- DELETE FROM harvests WHERE user_id = [USER_ID];

-- ----------------------------------------
-- 4. Hapus semua data keuangan (finances)
-- ----------------------------------------
-- DELETE FROM finances;
-- Atau berdasarkan user:
-- DELETE FROM finances WHERE user_id = [USER_ID];

-- ----------------------------------------
-- 5. Hapus semua data lahan (lands)
-- ----------------------------------------
-- DELETE FROM lands;
-- Atau berdasarkan user:
-- DELETE FROM lands WHERE user_id = [USER_ID];

-- ----------------------------------------
-- 6. Hapus semua notifikasi (notifications)
-- ----------------------------------------
-- DELETE FROM notifications;
-- Atau berdasarkan user:
-- DELETE FROM notifications WHERE user_id = [USER_ID];

-- ----------------------------------------
-- 7. Hapus semua data reminder
-- ----------------------------------------
-- DELETE FROM reminders;

-- ----------------------------------------
-- 8. Hapus semua data productivity metrics
-- ----------------------------------------
-- DELETE FROM productivity_metrics;

-- ----------------------------------------
-- 9. Reset auto-increment sequences (PostgreSQL)
-- ----------------------------------------
-- ALTER SEQUENCE plants_id_seq RESTART WITH 1;
-- ALTER SEQUENCE maintenance_id_seq RESTART WITH 1;
-- ALTER SEQUENCE harvests_id_seq RESTART WITH 1;
-- ALTER SEQUENCE finances_id_seq RESTART WITH 1;
-- ALTER SEQUENCE lands_id_seq RESTART WITH 1;
-- ALTER SEQUENCE notifications_id_seq RESTART WITH 1;
-- ALTER SEQUENCE reminders_id_seq RESTART WITH 1;
-- ALTER SEQUENCE productivity_metrics_id_seq RESTART WITH 1;

-- ----------------------------------------
-- 10. FULL RESET (HATI-HATI!)
-- ----------------------------------------
-- Hapus SEMUA data dari semua tabel kecuali users dan plant_types
/*
TRUNCATE TABLE plants, maintenance, harvests, finances, lands, notifications, reminders, productivity_metrics RESTART IDENTITY CASCADE;
*/

-- ========================================
-- QUERY UNTUK CEK DATA SEBELUM DIHAPUS
-- ========================================

-- Cek jumlah data per tabel
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

-- Cek data plants terbaru
SELECT id, name, planting_date, status, created_at 
FROM plants 
ORDER BY created_at DESC 
LIMIT 5;

-- Cek user yang ada data nya
SELECT DISTINCT u.id, u.username, u.email, COUNT(p.id) as plant_count
FROM users u
LEFT JOIN plants p ON u.id = p.user_id
GROUP BY u.id, u.username, u.email
ORDER BY plant_count DESC;
