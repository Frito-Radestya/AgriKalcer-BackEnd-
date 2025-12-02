// Check maintenance data di database
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'agri_db',
  password: 'admin',
  port: 5432
});

async function checkMaintenanceData() {
  try {
    console.log('=== CHECKING MAINTENANCE DATA ===');
    
    // Check semua maintenance data
    const result = await pool.query(`
      SELECT id, type, date, description, 
        CASE 
          WHEN date IS NULL THEN 'NULL'
          WHEN date = '' THEN 'EMPTY'
          WHEN date = '0000-00-00' THEN 'ZERO'
          ELSE 'OK'
        END as date_status
      FROM maintenance 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.log('Total maintenance records:', result.rows.length);
    
    result.rows.forEach((row, i) => {
      console.log(`${i + 1}. ID: ${row.id}, Type: ${row.type}, Date: "${row.date}", Status: ${row.date_status}, Desc: ${row.description}`);
    });
    
    // Check untuk tanggal yang bermasalah
    const problematicResult = await pool.query(`
      SELECT id, type, date, description
      FROM maintenance 
      WHERE date IS NULL 
         OR date = '' 
         OR date = '0000-00-00'
         OR date ~ '[^0-9-]'
         OR LENGTH(date) != 10
    `);
    
    if (problematicResult.rows.length > 0) {
      console.log('\n=== PROBLEMATIC DATES ===');
      problematicResult.rows.forEach((row, i) => {
        console.log(`${i + 1}. ID: ${row.id}, Type: ${row.type}, Date: "${row.date}", Desc: ${row.description}`);
      });
    } else {
      console.log('\n✅ No problematic dates found');
    }
    
  } catch (error) {
    console.error('Database error:', error.message);
  } finally {
    await pool.end();
  }
}

checkMaintenanceData();
