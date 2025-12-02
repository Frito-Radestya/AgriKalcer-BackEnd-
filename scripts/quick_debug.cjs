// Quick debug untuk notifikasi
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'agri_db',
  password: 'admin',
  port: 5432
});

async function quickDebug() {
  try {
    console.log('=== QUICK DEBUG NOTIFIKASI ===');
    
    // 1. Cek templates
    console.log('\n1. CEK TEMPLATES:');
    const templateResult = await pool.query(`
      SELECT template_key, title_template 
      FROM message_templates 
      WHERE template_key LIKE '%plant%' OR template_key LIKE '%water%'
      ORDER BY template_key
    `);
    
    console.log(`Templates found: ${templateResult.rows.length}`);
    templateResult.rows.forEach(row => {
      console.log(`  ✓ ${row.template_key}: ${row.title_template}`);
    });
    
    if (templateResult.rows.length === 0) {
      console.log('❌ NO TEMPLATES FOUND! Run the SQL script first.');
      return;
    }
    
    // 2. Cek notifikasi terbaru (last 30 minutes)
    console.log('\n2. CEK NOTIFIKASI TERBARU:');
    const notifResult = await pool.query(`
      SELECT id, title, message, type, created_at
      FROM notifications 
      WHERE created_at > NOW() - INTERVAL '30 minutes'
      ORDER BY created_at DESC
    `);
    
    console.log(`Notifications in last 30 min: ${notifResult.rows.length}`);
    notifResult.rows.forEach(row => {
      console.log(`  - ${row.title} (${row.type}) - ${row.created_at}`);
    });
    
    // 3. Cek plants terbaru
    console.log('\n3. CEK PLANTS TERBARU:');
    const plantResult = await pool.query(`
      SELECT id, name, status, created_at
      FROM plants 
      WHERE created_at > NOW() - INTERVAL '30 minutes'
      ORDER BY created_at DESC
    `);
    
    console.log(`Plants added in last 30 min: ${plantResult.rows.length}`);
    plantResult.rows.forEach(row => {
      console.log(`  - ${row.name} (${row.status}) - ${row.created_at}`);
    });
    
    // 4. Test manual template
    console.log('\n4. TEST MANUAL TEMPLATE:');
    try {
      const testResult = await pool.query(`
        INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id, is_read)
        VALUES (1, '🧪 Test Template', 'Test notifikasi manual', 'test', 'plant', 1, false)
        RETURNING id, title, created_at
      `);
      
      console.log(`✅ Manual notification created: ID ${testResult.rows[0].id}`);
      
      // Delete test notification
      await pool.query('DELETE FROM notifications WHERE id = $1', [testResult.rows[0].id]);
      console.log('✅ Test notification deleted');
      
    } catch (error) {
      console.log('❌ Manual notification failed:', error.message);
    }
    
  } catch (error) {
    console.error('Debug error:', error.message);
  } finally {
    await pool.end();
  }
}

quickDebug();
