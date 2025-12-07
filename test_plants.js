import { query } from './src/db.js';

async function testPlants() {
  try {
    const { rows } = await query(`
      SELECT p.*, 
             l.id as land_id, l.name as land_name, l.area_size as land_area_size, l.location as land_location,
             pt.id as plant_type_id, pt.name as plant_type_name, pt.watering_interval,
             p.estimated_harvest_date
      FROM plants p
      LEFT JOIN lands l ON p.land_id = l.id
      LEFT JOIN plant_types pt ON p.plant_type_id = pt.id
      WHERE p.user_id = 1
      ORDER BY p.created_at DESC NULLS LAST
      LIMIT 3
    `);
    console.log('Plants with relations:', JSON.stringify(rows, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

testPlants();
