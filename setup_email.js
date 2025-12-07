import { encrypt } from './src/utils/emailConfig.js';
import db from './src/db.js';

async function setupEmailSettings() {
  try {
    // Buat tabel email_settings jika belum ada
    await db.query(`
      CREATE TABLE IF NOT EXISTS email_settings (
        id SERIAL PRIMARY KEY,
        smtp_host VARCHAR(255) NOT NULL,
        smtp_port INTEGER NOT NULL,
        smtp_secure BOOLEAN NOT NULL,
        smtp_user VARCHAR(255) NOT NULL,
        smtp_password TEXT NOT NULL,
        from_email VARCHAR(255) NOT NULL,
        from_name VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Tabel email_settings berhasil dibuat atau sudah ada');

    // Enkripsi password
    const password = 'Frito2205';
    const encryptionKey = process.env.ENCRYPTION_KEY || 'default-encryption-key-32-char-long';
    const encryptedPassword = encrypt(password, encryptionKey);
    console.log('Password berhasil dienkripsi');

    // Insert konfigurasi email default
    await db.query(`
      INSERT INTO email_settings (
        smtp_host, smtp_port, smtp_secure, smtp_user, smtp_password,
        from_email, from_name, is_active
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8
      ) ON CONFLICT (id) DO UPDATE SET
        smtp_host = EXCLUDED.smtp_host,
        smtp_port = EXCLUDED.smtp_port,
        smtp_secure = EXCLUDED.smtp_secure,
        smtp_user = EXCLUDED.smtp_user,
        smtp_password = EXCLUDED.smtp_password,
        from_email = EXCLUDED.from_email,
        from_name = EXCLUDED.from_name,
        is_active = EXCLUDED.is_active,
        updated_at = CURRENT_TIMESTAMP
    `, [
      'smtp.gmail.com',
      587,
      true,
      'lumbungtani.app@gmail.com',
      encryptedPassword,
      'lumbungtani.app@gmail.com',
      'Lumbung Tani',
      true
    ]);

    console.log('Konfigurasi email berhasil disimpan');
    
    // Verifikasi data
    const result = await db.query('SELECT * FROM email_settings WHERE is_active = true');
    console.log('Email settings aktif:', result.rows[0]);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

setupEmailSettings();
