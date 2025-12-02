-- Cek semua tabel yang ada di database
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Cek sequence yang ada
SELECT sequence_name 
FROM information_schema.sequences 
WHERE sequence_schema = 'public' 
ORDER BY sequence_name;
