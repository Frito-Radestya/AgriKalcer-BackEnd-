-- Migration untuk menambahkan tabel yang kurang
-- Tabel-tabel berikut sudah ada di database Anda, jadi tidak perlu dibuat lagi:
-- - users ✓
-- - lands ✓  
-- - plants ✓
-- - plant_types ✓
-- - notifications ✓ (tapi struktur sedikit berbeda)
-- - reminders ✓
-- - maintenance_logs ✓ (berbeda dengan maintenance yang saya buat)
-- - productivity_metrics ✓
-- - user_settings ✓
-- - user_activities ✓
-- - message_templates ✓

-- Tabel yang BELUM ADA dan perlu dibuat:

-- Table: finances (Keuangan)
CREATE TABLE IF NOT EXISTS finances (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('income', 'expense')),
  category VARCHAR(100),
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  plant_id INTEGER REFERENCES plants(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: harvests (Panen)
CREATE TABLE IF NOT EXISTS harvests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plant_id INTEGER NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  price_per_kg DECIMAL(10, 2) NOT NULL,
  revenue DECIMAL(12, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: maintenance (Perawatan sederhana - berbeda dengan maintenance_logs)
-- Jika Anda ingin menggunakan maintenance_logs saja, bisa skip tabel ini
-- Tapi backend saya sudah dibuat untuk tabel 'maintenance', jadi dibuat juga
CREATE TABLE IF NOT EXISTS maintenance (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plant_id INTEGER NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  cost DECIMAL(12, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes untuk performa
CREATE INDEX IF NOT EXISTS idx_finances_user_id ON finances(user_id);
CREATE INDEX IF NOT EXISTS idx_finances_date ON finances(date);
CREATE INDEX IF NOT EXISTS idx_finances_plant_id ON finances(plant_id);

CREATE INDEX IF NOT EXISTS idx_maintenance_user_id ON maintenance(user_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_plant_id ON maintenance(plant_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_date ON maintenance(date);

CREATE INDEX IF NOT EXISTS idx_harvests_user_id ON harvests(user_id);
CREATE INDEX IF NOT EXISTS idx_harvests_plant_id ON harvests(plant_id);
CREATE INDEX IF NOT EXISTS idx_harvests_date ON harvests(date);

-- Catatan: 
-- 1. Tabel notifications sudah ada tapi strukturnya berbeda dengan yang saya buat
--    - Yang ada: is_read, related_entity_type, related_entity_id, read_at
--    - Yang saya buat: read, plant_id
--    Backend perlu disesuaikan untuk menggunakan struktur yang sudah ada
-- 
-- 2. Tabel maintenance_logs sudah ada tapi struktur berbeda dengan maintenance
--    - maintenance_logs lebih kompleks (ada reminder_id, activity_type, performed_at)
--    - maintenance lebih sederhana (type, date, notes, cost)
--    Saya membuat kedua-duanya agar backend bisa bekerja

