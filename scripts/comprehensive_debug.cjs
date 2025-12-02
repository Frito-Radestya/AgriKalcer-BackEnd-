// Comprehensive debug untuk notifikasi
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'agri_db',
  password: 'admin',
  port: 5432
});

async function comprehensiveDebug() {
  try {
    console.log('=== COMPREHENSIVE DEBUG NOTIFIKASI ===');
    
    // 1. Cek semua templates
    console.log('\n1. SEMUA TEMPLATES:');
    const allTemplates = await pool.query(`
      SELECT template_key, title_template, category 
      FROM message_templates 
      ORDER BY template_key
    `);
    
    console.log(`Total templates: ${allTemplates.rows.length}`);
    allTemplates.rows.forEach(row => {
      console.log(`  ${row.template_key}: ${row.title_template}`);
    });
    
    // 2. Cek notifikasi hari ini
    console.log('\n2. NOTIFIKASI HARI INI:');
    const todayNotifs = await pool.query(`
      SELECT id, title, message, type, related_entity_type, related_entity_id, created_at
      FROM notifications 
      WHERE DATE(created_at) = CURRENT_DATE
      ORDER BY created_at DESC
    `);
    
    console.log(`Notifications today: ${todayNotifs.rows.length}`);
    todayNotifs.rows.forEach(row => {
      console.log(`  - ${row.title} (${row.type}) - ${row.related_entity_type}:${row.related_entity_id}`);
    });
    
    // 3. Cek maintenance hari ini
    console.log('\n3. MAINTENANCE HARI INI:');
    const todayMaintenance = await pool.query(`
      SELECT id, type, description, plant_id, created_at
      FROM maintenance 
      WHERE DATE(created_at) = CURRENT_DATE
      ORDER BY created_at DESC
    `);
    
    console.log(`Maintenance today: ${todayMaintenance.rows.length}`);
    todayMaintenance.rows.forEach(row => {
      console.log(`  - ${row.type}: ${row.description} (Plant: ${row.plant_id})`);
    });
    
    // 4. Cek plants hari ini
    console.log('\n4. PLANTS HARI INI:');
    const todayPlants = await pool.query(`
      SELECT id, name, status, created_at
      FROM plants 
      WHERE DATE(created_at) = CURRENT_DATE
      ORDER BY created_at DESC
    `);
    
    console.log(`Plants today: ${todayPlants.rows.length}`);
    todayPlants.rows.forEach(row => {
      console.log(`  - ${row.name} (${row.status})`);
    });
    
    // 5. Test template lookup
    console.log('\n5. TEST TEMPLATE LOOKUP:');
    const testTemplates = ['plant_welcome', 'reminder_watering', 'reminder_fertilizing'];
    
    for (const templateKey of testTemplates) {
      const result = await pool.query(
        'SELECT * FROM message_templates WHERE template_key = $1',
        [templateKey]
      );
      
      console.log(`  ${templateKey}: ${result.rows.length > 0 ? '✓ FOUND' : '❌ NOT FOUND'}`);
      if (result.rows.length > 0) {
        console.log(`    Title: ${result.rows[0].title_template}`);
      }
    }
    
    // 6. Test notification creation
    console.log('\n6. TEST NOTIFICATION CREATION:');
    try {
      const testNotif = await pool.query(`
        INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id, is_read)
        VALUES (1, '🧪 Debug Test', 'Test notifikasi debug', 'debug', 'plant', 1, false)
        RETURNING id, title, created_at
      `);
      
      console.log(`✅ Test notification created: ID ${testNotif.rows[0].id}`);
      
      // Delete test notification
      await pool.query('DELETE FROM notifications WHERE id = $1', [testNotif.rows[0].id]);
      console.log('✅ Test notification deleted');
      
    } catch (error) {
      console.log('❌ Test notification failed:', error.message);
    }
    
    // 7. Cek notification API endpoint
    console.log('\n7. NOTIFICATION API CHECK:');
    console.log('Test this URL in browser or curl:');
    console.log('GET http://localhost:5000/api/notifications');
    console.log('Headers: Authorization: Bearer <your-token>');
    
  } catch (error) {
    console.error('Debug error:', error.message);
  } finally {
    await pool.end();
  }
}

comprehensiveDebug();
