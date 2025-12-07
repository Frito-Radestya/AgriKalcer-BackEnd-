import { encrypt } from './src/utils/emailConfig.js';
import db from './src/db.js';

// Ganti dengan App Password 16 digit dari Google
const appPassword = process.argv[2] || 'YOUR_APP_PASSWORD_HERE';

if (appPassword === 'YOUR_APP_PASSWORD_HERE') {
  console.log('Error: Silakan ganti YOUR_APP_PASSWORD_HERE dengan App Password Anda');
  console.log('Usage: node quick_update.js "your-app-password-here"');
  process.exit(1);
}

async function updatePassword() {
  try {
    const encryptionKey = process.env.ENCRYPTION_KEY || 'default-encryption-key-32-char-long';
    const encryptedPassword = encrypt(appPassword, encryptionKey);
    
    await db.query(`
      UPDATE email_settings 
      SET smtp_password = $1
      WHERE is_active = true
    `, [encryptedPassword]);
    
    console.log('✅ App Password berhasil diperbarui');
    
    // Test email
    const { sendNewPasswordEmail } = await import('./src/utils/emailConfig.js');
    console.log('📧 Testing email sending...');
    const result = await sendNewPasswordEmail('frito@gmail.com', 'test123');
    
    if (result.success) {
      console.log('✅ Email berhasil dikirim!');
    } else {
      console.log('❌ Gagal mengirim email:', result.error);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

updatePassword();
