import db from '../src/db.js';

// Check current plants data
const { rows } = await db.query('SELECT id, name, planting_date, estimated_harvest_date FROM plants ORDER BY id DESC LIMIT 3');

rows.forEach(plant => {
  console.log(`Plant ${plant.id}: ${plant.planting_date} -> ${plant.estimated_harvest_date}`);
});
