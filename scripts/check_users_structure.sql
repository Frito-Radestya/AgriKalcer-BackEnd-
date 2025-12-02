-- Cek struktur tabel users
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Cek data users yang ada
SELECT * FROM users ORDER BY id LIMIT 5;

-- Cek struktur tabel plant_types
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'plant_types' AND table_schema = 'public'
ORDER BY ordinal_position;
