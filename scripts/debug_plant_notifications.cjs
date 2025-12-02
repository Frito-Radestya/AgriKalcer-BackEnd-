// Debug notifikasi tanaman
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'agri_db',
  password: 'admin',
  port: 5432
});

async function debugNotifications() {
  try {
    console.log('=== DEBUG NOTIFIKASI TANAMAN ===');
    
    // 1. Cek apakah templates ada
    console.log('\n1. CEK MESSAGE TEMPLATES:');
    const templateResult = await pool.query(`
      SELECT template_key, title_template, category 
      FROM message_templates 
      WHERE template_key LIKE '%plant%' OR template_key LIKE '%water%' OR template_key LIKE '%harvest%'
      ORDER BY template_key
    `);
    
    console.log(`Templates found: ${templateResult.rows.length}`);
    templateResult.rows.forEach(row => {
      console.log(`  - ${row.template_key}: ${row.title_template}`);
    });
    
    // 2. Cek notifikasi yang sudah dibuat
    console.log('\n2. CEK NOTIFIKASI TERBARU:');
    const notifResult = await pool.query(`
      SELECT id, title, message, type, created_at, related_entity_type, related_entity_id
      FROM notifications 
      WHERE created_at > NOW() - INTERVAL '1 hour'
      ORDER BY created_at DESC
    `);
    
    console.log(`Notifications in last 1 hour: ${notifResult.rows.length}`);
    notifResult.rows.forEach(row => {
      console.log(`  - ${row.title} (${row.type}) - ${row.created_at}`);
    });
    
    // 3. Cek reminders yang sudah dibuat
    console.log('\n3. CEK REMINDERS TERBARU:');
    const reminderResult = await pool.query(`
      SELECT id, type, title, due_date, status, created_at
      FROM reminders 
      WHERE created_at > NOW() - INTERVAL '1 hour'
      ORDER BY created_at DESC
    `);
    
    console.log(`Reminders in last 1 hour: ${reminderResult.rows.length}`);
    reminderResult.rows.forEach(row => {
      console.log(`  - ${row.title} (${row.type}) - Due: ${row.due_date}`);
    });
    
    // 4. Cek plants yang baru ditambahkan
    console.log('\n4. CEK PLANTS TERBARU:');
    const plantResult = await pool.query(`
      SELECT id, name, planting_date, status, created_at
      FROM plants 
      WHERE created_at > NOW() - INTERVAL '1 hour'
      ORDER BY created_at DESC
    `);
    
    console.log(`Plants added in last 1 hour: ${plantResult.rows.length}`);
    plantResult.rows.forEach(row => {
      console.log(`  - ${row.name} (${row.status}) - Planted: ${row.planting_date}`);
    });
    
    // 5. Cek error logs (jika ada)
    console.log('\n5. CEK BACKEND LOGS:');
    console.log('Check backend console untuk error messages seperti:');
    console.log('  - "Template plant_welcome not found"');
    console.log('  - "Error creating plant notifications"');
    console.log('  - "Error creating notification from template"');
    
    // 6. Test manual notification creation
    console.log('\n6. TEST MANUAL NOTIFICATION:');
    try {
      const testResult = await pool.query(`
        INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id, is_read)
        VALUES (1, '🧪 Test Notifikasi', 'Ini adalah test notifikasi manual', 'test', 'plant', 1, false)
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

debugNotifications();
