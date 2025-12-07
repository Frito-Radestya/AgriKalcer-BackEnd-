import { encrypt } from './src/utils/emailConfig.js';
import db from './src/db.js';

async function updateAppPassword() {
  try {
    // Ganti dengan App Password 16 digit dari Google
    const appPassword = 'YOUR_APP_PASSWORD_HERE'; // GANTI INI!
    const encryptionKey = process.env.ENCRYPTION_KEY || 'default-encryption-key-32-char-long';
    const encryptedPassword = encrypt(appPassword, encryptionKey);
    
    // Update password di database
    await db.query(`
      UPDATE email_settings 
      SET smtp_password = $1
      WHERE is_active = true
    `, [encryptedPassword]);
    
    console.log('App Password berhasil diperbarui');
    
    // Test email
    const { sendNewPasswordEmail } = await import('./src/utils/emailConfig.js');
    const result = await sendNewPasswordEmail('frito@gmail.com', 'test123');
    console.log('Test email result:', result);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

updateAppPassword();
