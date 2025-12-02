import db from './src/db.js';

async function analyzeTables() {
  try {
    console.log('🔍 Analyzing harvests table structure...');
    const harvestsSchema = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'harvests'
      ORDER BY ordinal_position
    `);
    console.log('📋 HARVESTS COLUMNS:');
    harvestsSchema.rows.forEach(col => {
      console.log(`  ${col.column_name} | ${col.data_type} | ${col.is_nullable} | ${col.column_default || 'NULL'}`);
    });

    console.log('\n🔍 Analyzing plants table structure...');
    const plantsSchema = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'plants'
      ORDER BY ordinal_position
    `);
    console.log('📋 PLANTS COLUMNS:');
    plantsSchema.rows.forEach(col => {
      console.log(`  ${col.column_name} | ${col.data_type} | ${col.is_nullable} | ${col.column_default || 'NULL'}`);
    });

    console.log('\n🔍 Sample harvests data:');
    const sampleHarvests = await db.query('SELECT * FROM harvests LIMIT 2');
    console.log('📊 SAMPLE HARVESTS:');
    sampleHarvests.rows.forEach(row => {
      console.log('  Row:', Object.keys(row));
    });

    console.log('\n🔍 Sample plants data:');
    const samplePlants = await db.query('SELECT * FROM plants LIMIT 2');
    console.log('📊 SAMPLE PLANTS:');
    samplePlants.rows.forEach(row => {
      console.log('  Row:', Object.keys(row));
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    process.exit(1);
  }
}

analyzeTables();
