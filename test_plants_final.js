import { query } from './src/db.js';

async function testPlants() {
  try {
    const { rows } = await query(`
      SELECT p.*, 
             l.id as land_id, l.name as land_name, l.area_size as land_area_size, l.location as land_location,
             pt.id as plant_type_id, pt.name as plant_type_name, pt.watering_interval, pt.icon, pt.harvest_days,
             p.estimated_harvest_date
      FROM plants p
      LEFT JOIN lands l ON p.land_id = l.id
      LEFT JOIN plant_types pt ON p.plant_type_id = pt.id
      WHERE p.user_id = 1
      ORDER BY p.created_at DESC NULLS LAST
      LIMIT 2
    `);
    
    // Simulasi presentPlant function
    const presentPlant = (row) => {
      return {
        id: row.id,
        name: row.name,
        status: row.status,
        planting_date: row.planting_date ? new Date(row.planting_date).toLocaleDateString('en-CA') : null,
        estimated_harvest_date: row.estimated_harvest_date ? new Date(row.estimated_harvest_date).toLocaleDateString('en-CA') : null,
        notes: row.notes,
        land: row.land_id
          ? { id: row.land_id, name: row.land_name, area_size: row.land_area_size, location: row.land_location }
          : null,
        plant_type: row.plant_type_id
          ? { id: row.plant_type_id, name: row.plant_type_name, watering_interval: row.watering_interval, icon: row.icon, harvest_days: row.harvest_days }
          : null,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }
    };
    
    console.log('Formatted plants data:');
    rows.map(presentPlant).forEach(plant => {
      console.log(`- ${plant.name} (${plant.plant_type?.name} ${plant.plant_type?.icon})`);
      console.log(`  Land: ${plant.land?.name}`);
      console.log(`  Status: ${plant.status}`);
      console.log('');
    });
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

testPlants();
