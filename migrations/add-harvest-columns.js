import db from '../src/db.js';

async function addHarvestColumns() {
  try {
    console.log('🔄 Adding unit and quality columns to harvests table...');
    
    // Add unit column
    await db.query(`
      ALTER TABLE harvests 
      ADD COLUMN IF NOT EXISTS unit VARCHAR(10) DEFAULT 'kg'
    `);
    console.log('✅ Added unit column');
    
    // Add quality column
    await db.query(`
      ALTER TABLE harvests 
      ADD COLUMN IF NOT EXISTS quality VARCHAR(20) DEFAULT 'good'
    `);
    console.log('✅ Added quality column');
    
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

addHarvestColumns();
