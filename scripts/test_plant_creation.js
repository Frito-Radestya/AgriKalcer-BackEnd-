import db from '../src/db.js';

// Test plant creation
async function testPlantCreation() {
  try {
    const plantingDate = '2025-11-23';
    const { rows } = await db.query(
      'INSERT INTO plants (user_id, name, planting_date, status, plant_type_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [1, 'Test Plant', plantingDate, 'active', 1]
    );
    
    console.log('Created plant:', rows[0]);
    
    // Clean up test
    await db.query('DELETE FROM plants WHERE id = $1', [rows[0].id]);
    console.log('Test plant deleted');
  } catch (error) {
    console.error('Error:', error);
  }
}

testPlantCreation().then(() => process.exit(0));
