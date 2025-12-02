const db = require('./src/db.js');

async function checkUsers() {
  try {
    const result = await db.query('SELECT email, name FROM users LIMIT 5');
    console.log('Users:');
    result.rows.forEach(u => {
      console.log(`- ${u.email} (${u.name})`);
    });
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkUsers();
