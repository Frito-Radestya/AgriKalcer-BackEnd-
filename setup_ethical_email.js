import { encrypt } from './src/utils/emailConfig.js';
import db from './src/db.js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('📧 Setup Ethical Email untuk Lumbung Tani');
console.log('=====================================');
console.log('');
console.log('Jika belum punya akun, daftar dulu di: https://ethicalemail.dev/');
console.log('');

rl.question('Email Ethical Email: ', (email) => {
  rl.question('Password Ethical Email: ', (password) => {
    setupEthicalEmail(email, password);
  });
});

async function setupEthicalEmail(email, password) {
  try {
    const encryptionKey = process.env.ENCRYPTION_KEY || 'default-encryption-key-32-char-long';
    const encryptedPassword = encrypt(password, encryptionKey);
    
    // Update konfigurasi email
    await db.query(`
      UPDATE email_settings 
      SET smtp_host = $1,
          smtp_port = $2,
          smtp_secure = $3,
          smtp_user = $4,
          smtp_password = $5,
          from_email = $6,
          from_name = $7
      WHERE is_active = true
    `, [
      'smtp.ethicalemail.dev',
      587,
      false,
      email,
      encryptedPassword,
      email,
      'Lumbung Tani'
    ]);
    
    console.log('✅ Konfigurasi Ethical Email berhasil disimpan');
    
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
}
