-- Insert message templates untuk notifikasi tanaman
-- Jalankan query ini di database untuk menambahkan template

-- 1. Template notifikasi selamat datang tanaman baru
INSERT INTO message_templates (template_key, title, message, category) 
VALUES 
  ('plant_welcome', '🌱 Tanaman Baru Ditambahkan!', 
   'Selamat! Tanaman {{plant_name}} ({{plant_type}}) telah berhasil ditambahkan pada tanggal {{planting_date}}. Jangan lupa untuk merawatnya dengan baik!', 
   'plant')
ON CONFLICT (template_key) DO NOTHING;

-- 2. Template notifikasi penyiraman pertama
INSERT INTO message_templates (template_key, title, message, category) 
VALUES 
  ('first_watering', '💧 Waktu Penyiraman Pertama!', 
   'Tanaman {{plant_name}} baru saja ditanam hari ini. Pastikan untuk menyiramnya dengan cukup air untuk membantu akar tumbuh kuat.', 
   'maintenance')
ON CONFLICT (template_key) DO NOTHING;

-- 3. Template notifikasi penyiraman rutin
INSERT INTO message_templates (template_key, title, message, category) 
VALUES 
  ('reminder_watering', '💧 Jadwal Penyiraman', 
   'Saatnya menyiram tanaman {{plant_name}}! Penyiraman rutin membantu tanaman tetap segar dan tumbuh dengan baik.', 
   'maintenance')
ON CONFLICT (template_key) DO NOTHING;

-- 4. Template notifikasi pemupukan
INSERT INTO message_templates (template_key, title, message, category) 
VALUES 
  ('reminder_fertilizing', '🌿 Waktu Pemupukan', 
   'Tanaman {{plant_name}} membutuhkan nutrisi tambahan. Berikan pupuk sesuai anjuran untuk pertumbuhan yang optimal.', 
   'maintenance')
ON CONFLICT (template_key) DO NOTHING;

-- 5. Template notifikasi penyiangan
INSERT INTO message_templates (template_key, title, message, category) 
VALUES 
  ('reminder_weeding', '🔪 Waktu Penyiangan', 
   'Bersihkan gulma di sekitar tanaman {{plant_name}} untuk menghindari kompetisi nutrisi dan memastikan pertumbuhan maksimal.', 
   'maintenance')
ON CONFLICT (template_key) DO NOTHING;

-- 6. Template notifikasi pestisida
INSERT INTO message_templates (template_key, title, message, category) 
VALUES 
  ('reminder_pesticide', '🐛 Cek Hama dan Penyakit', 
   'Periksa tanaman {{plant_name}} untuk tanda-tanda hama atau penyakit. Tindakan preventif lebih baik daripada mengobati.', 
   'maintenance')
ON CONFLICT (template_key) DO NOTHING;

-- 7. Template notifikasi panen
INSERT INTO message_templates (template_key, title, message, category) 
VALUES 
  ('reminder_harvest', '🌾 Waktu Panen!', 
   'Tanaman {{plant_name}} siap dipanen! Panen pada saat yang tepat untuk hasil terbaik. Selamat panen!', 
   'harvest')
ON CONFLICT (template_key) DO NOTHING;

-- 8. Template notifikasi pertumbuhan
INSERT INTO message_templates (template_key, title, message, category) 
VALUES 
  ('plant_growth', '📊 Pertumbuhan Tanaman', 
   'Tanaman {{plant_name}} telah tumbuh selama {{days_since_planting}} hari. Terus pantau perkembangannya dan berikan perawatan terbaik!', 
   'plant')
ON CONFLICT (template_key) DO NOTHING;

-- 9. Template notifikasi peringatan kesehatan
INSERT INTO message_templates (template_key, title, message, category) 
VALUES 
  ('plant_health_alert', '⚠️ Peringatan Kesehatan Tanaman', 
   'Perhatikan kondisi tanaman {{plant_name}}. Ada beberapa tanda yang perlu diperiksa untuk memastikan kesehatannya tetap terjaga.', 
   'plant')
ON CONFLICT (template_key) DO NOTHING;

-- 10. Template notifikasi tips perawatan
INSERT INTO message_templates (template_key, title, message, category) 
VALUES 
  ('plant_care_tip', '💡 Tips Perawatan', 
   'Tips untuk tanaman {{plant_name}}: {{care_tip}}. Terapkan tips ini untuk hasil pertanian yang lebih baik!', 
   'tips')
ON CONFLICT (template_key) DO NOTHING;

-- Verifikasi templates yang sudah diinsert
SELECT template_key, title, category, created_at 
FROM message_templates 
WHERE template_key IN (
  'plant_welcome', 'first_watering', 'reminder_watering', 
  'reminder_fertilizing', 'reminder_weeding', 'reminder_pesticide',
  'reminder_harvest', 'plant_growth', 'plant_health_alert', 'plant_care_tip'
)
ORDER BY template_key;
