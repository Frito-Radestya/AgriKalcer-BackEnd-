import db from '../src/db.js';

// Update plants with wrong estimated_harvest_date
async function fixHarvestDates() {
  try {
    // Get all plants that need fixing
    const { rows } = await db.query(`
      SELECT id, planting_date, plant_type_id 
      FROM plants 
      WHERE estimated_harvest_date IS NULL
    `);
    
    for (const plant of rows) {
      // Get harvest days from plant type
      let harvestDays = 60; // default
      if (plant.plant_type_id) {
        const { rows: typeRows } = await db.query('SELECT harvest_days FROM plant_types WHERE id = $1', [plant.plant_type_id]);
        if (typeRows.length && typeRows[0].harvest_days) {
          harvestDays = typeRows[0].harvest_days;
        }
      }
      
      // Calculate correct harvest date (planting_date + harvest_days)
      const plantingDate = new Date(plant.planting_date);
      plantingDate.setHours(0, 0, 0, 0);
      plantingDate.setDate(plantingDate.getDate() + harvestDays);
      
      // Update the plant
      await db.query('UPDATE plants SET estimated_harvest_date = $1 WHERE id = $2', [
        plantingDate.toISOString().split('T')[0], 
        plant.id
      ]);
      
      console.log(`Updated plant ${plant.id}: ${plant.planting_date} -> ${plantingDate.toISOString().split('T')[0]}`);
    }
    
    console.log('Fixed harvest dates for', rows.length, 'plants');
  } catch (error) {
    console.error('Error fixing harvest dates:', error);
  }
}

fixHarvestDates().then(() => process.exit(0));
