// Check structure of message_templates table
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'agri_db',
  password: 'admin',
  port: 5432
});

async function checkTableStructure() {
  try {
    console.log('=== MESSAGE_TEMPLATES TABLE STRUCTURE ===');
    
    // Get table structure
    const structureResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'message_templates'
      ORDER BY ordinal_position
    `);
    
    console.log('Columns:');
    structureResult.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Check existing data
    const dataResult = await pool.query(`
      SELECT * FROM message_templates LIMIT 5
    `);
    
    console.log('\n=== EXISTING DATA ===');
    if (dataResult.rows.length > 0) {
      console.log('Sample data:');
      dataResult.rows.forEach((row, i) => {
        console.log(`  Row ${i + 1}:`, row);
      });
    } else {
      console.log('No existing data found');
    }
    
    // Check constraints
    const constraintResult = await pool.query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'message_templates'
    `);
    
    console.log('\n=== CONSTRAINTS ===');
    constraintResult.rows.forEach(constraint => {
      console.log(`  ${constraint.constraint_name}: ${constraint.constraint_type}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTableStructure();
