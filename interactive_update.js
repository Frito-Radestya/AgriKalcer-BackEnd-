import { encrypt } from './src/utils/emailConfig.js';
import db from './src/db.js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Masukkan App Password 16 digit dari Google: ', async (appPassword) => {
  if (!appPassword || appPassword.length < 16) {
    console.log('❌ Error: App Password harus 16 digit');
    rl.close();
    process.exit(1);
  }

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
      console.log('📧 Silakan periksa inbox frito@gmail.com');
    } else {
      console.log('❌ Gagal mengirim email:', result.error);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    rl.close();
    process.exit(0);
  }
});
