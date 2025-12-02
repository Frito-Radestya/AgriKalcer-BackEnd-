-- COMPLETE NOTIFICATION FIX
-- Jalankan script ini untuk memperbaiki semua masalah notifikasi

-- STEP 1: Insert semua templates yang diperlukan
INSERT INTO message_templates (template_key, title_template, message_template, variables, category) 
VALUES 
  ('plant_welcome', '🌱 Tanaman Baru Ditambahkan!', 
   'Selamat! Tanaman {{plant_name}} ({{plant_type}}) telah berhasil ditambahkan pada tanggal {{planting_date}}. Jangan lupa untuk merawatnya dengan baik!', 
   '{"plant_name": "string", "plant_type": "string", "planting_date": "date"}',
   'plant')
ON CONFLICT (template_key) DO NOTHING;

INSERT INTO message_templates (template_key, title_template, message_template, variables, category) 
VALUES 
  ('first_watering', '💧 Waktu Penyiraman Pertama!', 
   'Tanaman {{plant_name}} baru saja ditanam hari ini. Pastikan untuk menyiramnya dengan cukup air untuk membantu akar tumbuh kuat.', 
   '{"plant_name": "string", "planting_date": "date"}',
   'maintenance')
ON CONFLICT (template_key) DO NOTHING;

INSERT INTO message_templates (template_key, title_template, message_template, variables, category) 
VALUES 
  ('reminder_watering', '💧 Jadwal Penyiraman', 
   'Saatnya menyiram tanaman {{plant_name}}! Penyiraman rutin membantu tanaman tetap segar dan tumbuh dengan baik.', 
   '{"plant_name": "string"}',
   'maintenance')
ON CONFLICT (template_key) DO NOTHING;

INSERT INTO message_templates (template_key, title_template, message_template, variables, category) 
VALUES 
  ('reminder_fertilizing', '🌿 Waktu Pemupukan', 
   'Tanaman {{plant_name}} membutuhkan nutrisi tambahan. Berikan pupuk sesuai anjuran untuk pertumbuhan yang optimal.', 
   '{"plant_name": "string"}',
   'maintenance')
ON CONFLICT (template_key) DO NOTHING;

INSERT INTO message_templates (template_key, title_template, message_template, variables, category) 
VALUES 
  ('reminder_weeding', '🔪 Waktu Penyiangan', 
   'Bersihkan gulma di sekitar tanaman {{plant_name}} untuk menghindari kompetisi nutrisi dan memastikan pertumbuhan maksimal.', 
   '{"plant_name": "string"}',
   'maintenance')
ON CONFLICT (template_key) DO NOTHING;

INSERT INTO message_templates (template_key, title_template, message_template, variables, category) 
VALUES 
  ('reminder_pesticide', '🐛 Cek Hama dan Penyakit', 
   'Periksa tanaman {{plant_name}} untuk tanda-tanda hama atau penyakit. Tindakan preventif lebih baik daripada mengobati.', 
   '{"plant_name": "string"}',
   'maintenance')
ON CONFLICT (template_key) DO NOTHING;

INSERT INTO message_templates (template_key, title_template, message_template, variables, category) 
VALUES 
  ('reminder_harvest', '🌾 Waktu Panen!', 
   'Tanaman {{plant_name}} siap dipanen! Panen pada saat yang tepat untuk hasil terbaik. Selamat panen!', 
   '{"plant_name": "string"}',
   'harvest')
ON CONFLICT (template_key) DO NOTHING;

-- STEP 2: Verify templates
SELECT 'TEMPLATES INSERTED' as status, COUNT(*) as count 
FROM message_templates 
WHERE template_key IN (
  'plant_welcome', 'first_watering', 'reminder_watering', 
  'reminder_fertilizing', 'reminder_weeding', 'reminder_pesticide', 'reminder_harvest'
);

-- STEP 3: Clean up test notifications
DELETE FROM notifications WHERE type = 'debug' OR title LIKE '%Test%';

-- STEP 4: Test notification creation
DO $$
DECLARE
    test_notif_id INTEGER;
BEGIN
    INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id, is_read)
    VALUES (1, '🧪 Test Notifikasi', 'Test notifikasi sistem', 'test', 'plant', 1, false)
    RETURNING id INTO test_notif_id;
    
    RAISE NOTICE '✅ Test notification created with ID: %', test_notif_id;
    
    DELETE FROM notifications WHERE id = test_notif_id;
    RAISE NOTICE '✅ Test notification deleted';
END $$;

-- STEP 5: Check existing notifications
SELECT 'EXISTING NOTIFICATIONS' as status, COUNT(*) as count 
FROM notifications 
WHERE DATE(created_at) = CURRENT_DATE;

-- STEP 6: Check recent plants
SELECT 'RECENT PLANTS' as status, COUNT(*) as count 
FROM plants 
WHERE DATE(created_at) = CURRENT_DATE;

-- STEP 7: Check recent maintenance
SELECT 'RECENT MAINTENANCE' as status, COUNT(*) as count 
FROM maintenance 
WHERE DATE(created_at) = CURRENT_DATE;

COMMIT;

-- STEP 8: Manual test queries (uncomment to test)
/*
-- Test plant notification manually
INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id, is_read)
VALUES (1, '🌱 Test Tanaman Baru', 'Test: Tanaman tomat berhasil ditambahkan!', 'plant', 'plant', 1, false);

-- Test maintenance notification manually  
INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id, is_read)
VALUES (1, '💧 Test Penyiraman', 'Test: Penyiraman tanaman tomat selesai!', 'maintenance', 'maintenance', 1, false);
*/
