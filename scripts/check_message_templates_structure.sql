-- Check structure of message_templates table
-- Jalankan query ini di database untuk melihat struktur tabel

-- 1. Lihat struktur tabel
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'message_templates'
ORDER BY ordinal_position;

-- 2. Lihat data yang sudah ada
SELECT * FROM message_templates LIMIT 5;

-- 3. Lihat constraints
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'message_templates';

-- 4. Cek apakah tabel exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE  table_schema = 'public'
   AND    table_name   = 'message_templates'
);

-- 5. Jika tabel tidak ada, buat tabel baru
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
*/

-- 6. Alternatif: Cek semua tabel yang ada
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
