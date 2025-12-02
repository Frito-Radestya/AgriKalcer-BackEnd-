const db = require('./src/db.js');

async function checkCurrentData() {
  try {
    const result = await db.query('SELECT id, name, area_size, latitude, longitude, updated_at FROM lands ORDER BY id LIMIT 3');
    console.log('Current data in database:');
    result.rows.forEach(r => {
      console.log(`ID ${r.id}: ${r.name}`);
      console.log(`  - area: ${r.area_size}`);
      console.log(`  - lat: ${r.latitude}`);
      console.log(`  - lng: ${r.longitude}`);
      console.log(`  - updated: ${r.updated_at}`);
      console.log('---');
    });
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkCurrentData();
