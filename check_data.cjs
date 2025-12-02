const db = require('./src/db.js');

async function checkData() {
  try {
    const result = await db.query('SELECT id, name, area_size, location, notes FROM lands ORDER BY id');
    console.log('Current database data:');
    result.rows.forEach(row => {
      console.log(`ID ${row.id}: ${row.name} - ${row.area_size} m²`);
    });
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkData();
