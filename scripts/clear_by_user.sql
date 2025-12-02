-- ========================================
-- CLEAR DATA BY SPECIFIC USER
-- ========================================
-- Ganti [USER_ID] dengan ID user yang ingin dihapus datanya

-- Contoh: Hapus semua data untuk user dengan ID = 1
-- DELETE FROM plants WHERE user_id = 1;
-- DELETE FROM maintenance WHERE user_id = 1;
-- DELETE FROM harvests WHERE user_id = 1;
-- DELETE FROM finances WHERE user_id = 1;
-- DELETE FROM lands WHERE user_id = 1;
-- DELETE FROM notifications WHERE user_id = 1;

-- ========================================
-- TEMPLATE: Copy paste dan ganti USER_ID
-- ========================================

-- 1. Cek user ID yang ada
SELECT id, username, email, created_at FROM users ORDER BY id;

-- 2. Cek data untuk user tertentu sebelum dihapus
-- Ganti 1 dengan user ID yang ingin dicek
SELECT 
  'plants' as table_name, COUNT(*) as count FROM plants WHERE user_id = 1
UNION ALL
SELECT 
  'maintenance' as table_name, COUNT(*) as count FROM maintenance WHERE user_id = 1
UNION ALL
SELECT 
  'harvests' as table_name, COUNT(*) as count FROM harvests WHERE user_id = 1
UNION ALL
SELECT 
  'finances' as table_name, COUNT(*) as count FROM finances WHERE user_id = 1
UNION ALL
SELECT 
  'lands' as table_name, COUNT(*) as count FROM lands WHERE user_id = 1
UNION ALL
SELECT 
  'notifications' as table_name, COUNT(*) as count FROM notifications WHERE user_id = 1;

-- 3. Hapus data untuk user tertentu (urutan penting untuk foreign key)
-- Ganti 1 dengan user ID yang ingin dihapus

-- Hapus notifikasi dulu
DELETE FROM notifications WHERE user_id = 1;

-- Hapus productivity metrics
DELETE FROM productivity_metrics WHERE user_id = 1;

-- Hapus reminders yang terkait dengan plants user ini
DELETE FROM reminders WHERE plant_id IN (
  SELECT id FROM plants WHERE user_id = 1
);

-- Hapus harvests
DELETE FROM harvests WHERE user_id = 1;

-- Hapus finances  
DELETE FROM finances WHERE user_id = 1;

-- Hapus maintenance
DELETE FROM maintenance WHERE user_id = 1;

-- Hapus plants
DELETE FROM plants WHERE user_id = 1;

-- Hapus lands
DELETE FROM lands WHERE user_id = 1;

-- 4. Verifikasi data sudah terhapus
SELECT 
  'plants' as table_name, COUNT(*) as count FROM plants WHERE user_id = 1
UNION ALL
SELECT 
  'maintenance' as table_name, COUNT(*) as count FROM maintenance WHERE user_id = 1
UNION ALL
SELECT 
  'harvests' as table_name, COUNT(*) as count FROM harvests WHERE user_id = 1
UNION ALL
SELECT 
  'finances' as table_name, COUNT(*) as count FROM finances WHERE user_id = 1
UNION ALL
SELECT 
  'lands' as table_name, COUNT(*) as count FROM lands WHERE user_id = 1
UNION ALL
SELECT 
  'notifications' as table_name, COUNT(*) as count FROM notifications WHERE user_id = 1;
