CREATE TABLE IF NOT EXISTS otp_codes (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp_hash VARCHAR(64) NOT NULL,
    purpose VARCHAR(50) DEFAULT 'verification',
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    attempts INTEGER DEFAULT 0,
    UNIQUE(email, purpose)
);

CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON otp_codes(email);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON otp_codes(expires_at);
