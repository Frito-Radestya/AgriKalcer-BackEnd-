// Check message templates
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'agri_db',
  password: 'admin',
  port: 5432
});

async function checkTemplates() {
  try {
    console.log('=== MESSAGE TEMPLATES ===');
    
    const result = await pool.query(`
      SELECT template_key, title, message 
      FROM message_templates 
      ORDER BY template_key
    `);
    
    console.log(`Total templates: ${result.rows.length}`);
    
    result.rows.forEach(row => {
      console.log(`${row.template_key}:`);
      console.log(`  Title: ${row.title}`);
      console.log(`  Message: ${row.message}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Database error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTemplates();
