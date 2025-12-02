-- Additional indexes for better query performance
-- Note: This migration only creates NEW indexes that don't exist in previous migrations
-- Indexes already created in 001/002: idx_finances_date, idx_harvests_date, idx_maintenance_date

-- Plants table indexes (NEW - not in previous migrations)
CREATE INDEX IF NOT EXISTS idx_plants_status ON plants(status);
CREATE INDEX IF NOT EXISTS idx_plants_planting_date ON plants(planting_date);
CREATE INDEX IF NOT EXISTS idx_plants_plant_type_id ON plants(plant_type_id);

-- Finances table - additional indexes (NEW)
CREATE INDEX IF NOT EXISTS idx_finances_type ON finances(type);
CREATE INDEX IF NOT EXISTS idx_finances_category ON finances(category);

-- Maintenance table - additional indexes (NEW)
CREATE INDEX IF NOT EXISTS idx_maintenance_type ON maintenance(type);

-- Lands table indexes (NEW - check if idx_lands_user_id exists in your schema)
CREATE INDEX IF NOT EXISTS idx_lands_user_id ON lands(user_id);
CREATE INDEX IF NOT EXISTS idx_lands_name ON lands(name);

-- Users table indexes (NEW)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

