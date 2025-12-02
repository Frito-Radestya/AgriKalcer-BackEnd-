const bcrypt = require('bcryptjs');
const db = require('./src/db.js');

async function resetPassword() {
  try {
    const newPassword = '123456';
    const hash = await bcrypt.hash(newPassword, 10);
    
    await db.query('UPDATE users SET password = $1 WHERE email = $2', [hash, 'frito.radestya@gmail.com']);
    
    console.log('✅ Password berhasil direset');
    console.log('Email: frito.radestya@gmail.com');
    console.log('Password baru: 123456');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

resetPassword();
