-- ========================================
-- QUICK RESET - Copy paste ini langsung
-- ========================================

-- Hapus semua data
DELETE FROM notifications;
DELETE FROM productivity_metrics;
DELETE FROM reminders;
DELETE FROM harvests;
DELETE FROM finances;
DELETE FROM maintenance;
DELETE FROM plants;
DELETE FROM lands;

-- Reset ID ke 1
ALTER SEQUENCE plants_id_seq RESTART WITH 1;
ALTER SEQUENCE maintenance_id_seq RESTART WITH 1;
ALTER SEQUENCE harvests_id_seq RESTART WITH 1;
ALTER SEQUENCE finances_id_seq RESTART WITH 1;
ALTER SEQUENCE lands_id_seq RESTART WITH 1;
ALTER SEQUENCE notifications_id_seq RESTART WITH 1;
ALTER SEQUENCE reminders_id_seq RESTART WITH 1;
ALTER SEQUENCE productivity_metrics_id_seq RESTART WITH 1;

-- Verifikasi (opsional)
SELECT 'plants', COUNT(*) FROM plants
UNION ALL
SELECT 'maintenance', COUNT(*) FROM maintenance
UNION ALL
SELECT 'harvests', COUNT(*) FROM harvests
UNION ALL
SELECT 'finances', COUNT(*) FROM finances
UNION ALL
SELECT 'lands', COUNT(*) FROM lands
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications;
