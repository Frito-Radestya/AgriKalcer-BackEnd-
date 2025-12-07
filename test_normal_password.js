import { encrypt } from './src/utils/emailConfig.js';
import db from './src/db.js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('⚠️  Opsi 1: Gunakan password Gmail biasa (perlu aktifkan "Less secure app access")');
console.log('🔐 Opsi 2: Gunakan App Password 16 digit (2FA harus aktif)');
console.log('');

rl.question('Pilih opsi (1 atau 2): ', (choice) => {
  if (choice === '1') {
    rl.question('Masukkan password Gmail biasa: ', async (password) => {
      await updatePassword(password);
    });
  } else if (choice === '2') {
    rl.question('Masukkan App Password 16 digit: ', async (appPassword) => {
      if (appPassword.length < 16) {
        console.log('❌ App Password harus 16 digit');
        rl.close();
        return;
      }
      await updatePassword(appPassword);
    });
  } else {
    console.log('❌ Pilihan tidak valid');
    rl.close();
  }
});

async function updatePassword(password) {
  try {
    const encryptionKey = process.env.ENCRYPTION_KEY || 'default-encryption-key-32-char-long';
    const encryptedPassword = encrypt(password, encryptionKey);
    
    await db.query(`
      UPDATE email_settings 
      SET smtp_password = $1
      WHERE is_active = true
    `, [encryptedPassword]);
    
    console.log('✅ Password berhasil diperbarui');
    
    // Test email
    const { sendNewPasswordEmail } = await import('./src/utils/emailConfig.js');
    console.log('📧 Testing email sending...');
    const result = await sendNewPasswordEmail('frito@gmail.com', 'test123');
    
    if (result.success) {
      console.log('✅ Email berhasil dikirim!');
      console.log('📧 Silakan periksa inbox frito@gmail.com');
    } else {
      console.log('❌ Gagal mengirim email:', result.error);
      
      if (result.error.includes('BadCredentials')) {
        console.log('');
        console.log('💡 Tips:');
        console.log('1. Jika menggunakan password biasa, aktifkan "Less secure app access":');
        console.log('   https://myaccount.google.com/lesssecureapps');
        console.log('2. Jika menggunakan App Password, pastikan 2FA aktif');
        console.log('3. Pastikan email lumbungtani.app@gmail.com bisa diakses');
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    rl.close();
    process.exit(0);
  }
}
