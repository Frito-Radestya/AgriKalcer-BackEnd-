-- Insert message templates untuk notifikasi tanaman
-- Jalankan query ini di database 
-- Sesuaikan nama kolom jika struktur tabel berbeda

-- Cek struktur tabel terlebih dahulu
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'message_templates';

-- VERSI 1: Jika tabel memiliki kolom: template_key, title, message, category
INSERT INTO message_templates (template_key, title, message, category) 
VALUES 
  ('plant_welcome', '🌱 Tanaman Baru Ditambahkan!', 
   'Selamat! Tanaman {{plant_name}} ({{plant_type}}) telah berhasil ditambahkan pada tanggal {{planting_date}}. Jangan lupa untuk merawatnya dengan baik!', 
   'plant')
ON CONFLICT (template_key) DO NOTHING;

INSERT INTO message_templates (template_key, title, message, category) 
VALUES 
  ('first_watering', '💧 Waktu Penyiraman Pertama!', 
   'Tanaman {{plant_name}} baru saja ditanam hari ini. Pastikan untuk menyiramnya dengan cukup air untuk membantu akar tumbuh kuat.', 
   'maintenance')
ON CONFLICT (template_key) DO NOTHING;

INSERT INTO message_templates (template_key, title, message, category) 
VALUES 
  ('reminder_watering', '💧 Jadwal Penyiraman', 
   'Saatnya menyiram tanaman {{plant_name}}! Penyiraman rutin membantu tanaman tetap segar dan tumbuh dengan baik.', 
   'maintenance')
ON CONFLICT (template_key) DO NOTHING;

INSERT INTO message_templates (template_key, title, message, category) 
VALUES 
  ('reminder_fertilizing', '🌿 Waktu Pemupukan', 
   'Tanaman {{plant_name}} membutuhkan nutrisi tambahan. Berikan pupuk sesuai anjuran untuk pertumbuhan yang optimal.', 
   'maintenance')
ON CONFLICT (template_key) DO NOTHING;

INSERT INTO message_templates (template_key, title, message, category) 
VALUES 
  ('reminder_weeding', '🔪 Waktu Penyiangan', 
   'Bersihkan gulma di sekitar tanaman {{plant_name}} untuk menghindari kompetisi nutrisi dan memastikan pertumbuhan maksimal.', 
   'maintenance')
ON CONFLICT (template_key) DO NOTHING;

INSERT INTO message_templates (template_key, title, message, category) 
VALUES 
  ('reminder_pesticide', '🐛 Cek Hama dan Penyakit', 
   'Periksa tanaman {{plant_name}} untuk tanda-tanda hama atau penyakit. Tindakan preventif lebih baik daripada mengobati.', 
   'maintenance')
ON CONFLICT (template_key) DO NOTHING;

INSERT INTO message_templates (template_key, title, message, category) 
VALUES 
  ('reminder_harvest', '🌾 Waktu Panen!', 
   'Tanaman {{plant_name}} siap dipanen! Panen pada saat yang tepat untuk hasil terbaik. Selamat panen!', 
   'harvest')
ON CONFLICT (template_key) DO NOTHING;

-- VERSI 2: Jika tabel memiliki kolom berbeda, uncomment dan sesuaikan
/*
-- Jika kolomnya: key, title, content, type
INSERT INTO message_templates (key, title, content, type) 
VALUES 
  ('plant_welcome', '🌱 Tanaman Baru Ditambahkan!', 
   'Selamat! Tanaman {{plant_name}} ({{plant_type}}) telah berhasil ditambahkan pada tanggal {{planting_date}}. Jangan lupa untuk merawatnya dengan baik!', 
   'plant')
ON CONFLICT (key) DO NOTHING;

-- Jika kolomnya: name, subject, body, category
INSERT INTO message_templates (name, subject, body, category) 
VALUES 
  ('plant_welcome', '🌱 Tanaman Baru Ditambahkan!', 
   'Selamat! Tanaman {{plant_name}} ({{plant_type}}) telah berhasil ditambahkan pada tanggal {{planting_date}}. Jangan lupa untuk merawatnya dengan baik!', 
   'plant')
ON CONFLICT (name) DO NOTHING;

-- Jika kolomnya: template_key, title, description, type
INSERT INTO message_templates (template_key, title, description, type) 
VALUES 
  ('plant_welcome', '🌱 Tanaman Baru Ditambahkan!', 
   'Selamat! Tanaman {{plant_name}} ({{plant_type}}) telah berhasil ditambahkan pada tanggal {{planting_date}}. Jangan lupa untuk merawatnya dengan baik!', 
   'plant')
ON CONFLICT (template_key) DO NOTHING;
*/

-- VERSI 3: Jika tabel belum ada, buat tabel baru
/*
CREATE TABLE IF NOT EXISTS message_templates (
    id SERIAL PRIMARY KEY,
    template_key VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'general',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Kemudian insert data
INSERT INTO message_templates (template_key, title, message, category) 
VALUES 
  ('plant_welcome', '🌱 Tanaman Baru Ditambahkan!', 
   'Selamat! Tanaman {{plant_name}} ({{plant_type}}) telah berhasil ditambahkan pada tanggal {{planting_date}}. Jangan lupa untuk merawatnya dengan baik!', 
   'plant');
*/

-- Verifikasi templates yang sudah diinsert
SELECT template_key, title, category, created_at 
FROM message_templates 
WHERE template_key IN (
  'plant_welcome', 'first_watering', 'reminder_watering', 
  'reminder_fertilizing', 'reminder_weeding', 'reminder_pesticide',
  'reminder_harvest'
)
ORDER BY template_key;

-- Jika ada error, cek dengan query ini:
-- SELECT * FROM message_templates LIMIT 1;
