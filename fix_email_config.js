import db from './src/db.js';

async function fixEmailConfig() {
  try {
    // Update konfigurasi email untuk Gmail
    await db.query(`
      UPDATE email_settings 
      SET smtp_secure = false
      WHERE is_active = true
    `);
    
    console.log('Konfigurasi SMTP berhasil diperbaiki');
    
    // Verifikasi
    const result = await db.query('SELECT * FROM email_settings WHERE is_active = true');
    console.log('Email settings:', result.rows[0]);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

fixEmailConfig();
