-- Tambah kolom status panen di tabel plants
ALTER TABLE plants ADD COLUMN IF NOT EXISTS harvest_status VARCHAR(20) DEFAULT 'growing';

-- Buat indeks untuk pencarian yang lebih cepat
CREATE INDEX IF NOT EXISTS idx_plants_harvest_status ON plants(harvest_status);

-- Buat tabel notifikasi
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plant_id INTEGER NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL, -- 'watering', 'fertilizing', 'other'
    scheduled_time TIMESTAMP NOT NULL,
    is_read BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Buat indeks untuk performa
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_plant_id ON notifications(plant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled_time ON notifications(scheduled_time) WHERE is_active = true;
