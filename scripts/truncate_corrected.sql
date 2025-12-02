-- ========================================
-- TRUNCATE RESET - Corrected Version
-- ========================================

-- Truncate semua tabel data (kecuali users, plant_types, message_templates)
TRUNCATE TABLE 
  notifications,
  reminders,
  harvests,
  finances,
  maintenance,
  plants,
  lands
RESTART IDENTITY CASCADE;

-- ========================================
-- VERIFIKASI HASIL
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
  'reminders' as table_name, COUNT(*) as count FROM reminders;

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
  'reminders' as table_name, nextval('reminders_id_seq') as next_id;

-- ========================================
-- CEK DATA YANG TIDAK DIHAPUS (Generic Version)
-- ========================================

-- Users tetap ada (gunakan * untuk lihat semua kolom)
SELECT id, email FROM users ORDER BY id LIMIT 5;

-- Plant_types tetap ada  
SELECT id, name, watering_interval, harvest_days FROM plant_types ORDER BY id LIMIT 5;

-- Message templates tetap ada (jika ada)
SELECT id, name FROM message_templates ORDER BY id LIMIT 5;

-- ========================================
-- SELESAI! Database sudah bersih dan ID mulai dari 1
-- ========================================
