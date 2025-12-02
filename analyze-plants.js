import db from './src/db.js';

async function analyzePlantData() {
  try {
    console.log('🔍 Analyzing plants and plant_types data...');
    
    // Check plant_types table
    const plantTypes = await db.query('SELECT * FROM plant_types');
    console.log('📋 PLANT_TYPES TABLE:');
    plantTypes.rows.forEach(row => {
      console.log(`  ID: ${row.id} | Name: ${row.name} | Icon: ${row.icon || 'NO ICON'}`);
    });

    // Check plants table with their plant_type_id
    const plants = await db.query(`
      SELECT p.id, p.name, p.plant_type_id, pt.name as type_name, pt.icon
      FROM plants p
      LEFT JOIN plant_types pt ON p.plant_type_id = pt.id
      WHERE p.user_id = 1
      LIMIT 5
    `);
    console.log('\n📋 PLANTS WITH TYPE INFO:');
    plants.rows.forEach(row => {
      console.log(`  Plant: ${row.name} | Type ID: ${row.plant_type_id} | Type Name: ${row.type_name} | Icon: ${row.icon || 'NO ICON'}`);
    });

    // Check harvests with plant info
    const harvests = await db.query(`
      SELECT h.id, h.plant_id, p.name as plant_name, p.plant_type_id, pt.name as type_name, pt.icon
      FROM harvests h
      LEFT JOIN plants p ON h.plant_id = p.id
      LEFT JOIN plant_types pt ON p.plant_type_id = pt.id
      WHERE h.user_id = 1
      LIMIT 3
    `);
    console.log('\n📋 HARVESTS WITH PLANT INFO:');
    harvests.rows.forEach(row => {
      console.log(`  Harvest: ${row.plant_name} | Type ID: ${row.plant_type_id} | Type Name: ${row.type_name} | Icon: ${row.icon || 'NO ICON'}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    process.exit(1);
  }
}

analyzePlantData();
