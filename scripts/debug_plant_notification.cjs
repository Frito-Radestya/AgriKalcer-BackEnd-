// Debug khusus untuk plant notification
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'agri_db',
  password: 'admin',
  port: 5432
});

async function debugPlantNotification() {
  try {
    console.log('=== DEBUG PLANT NOTIFICATION ===');
    
    // 1. Cek plant yang baru ditambahkan (last 10 minutes)
    console.log('\n1. PLANTS TERBARU (10 menit terakhir):');
    const plantResult = await pool.query(`
      SELECT id, name, status, planting_date, created_at
      FROM plants 
      WHERE created_at > NOW() - INTERVAL '10 minutes'
      ORDER BY created_at DESC
    `);
    
    console.log(`Plants added in last 10 min: ${plantResult.rows.length}`);
    plantResult.rows.forEach(row => {
      console.log(`  - ${row.name} (${row.status}) - Created: ${row.created_at}`);
    });
    
    // 2. Cek notifikasi yang dibuat untuk plants tersebut
    console.log('\n2. NOTIFIKASI UNTUK PLANTS TERSEBUT:');
    if (plantResult.rows.length > 0) {
      const plantIds = plantResult.rows.map(p => p.id);
      const notifResult = await pool.query(`
        SELECT id, title, message, type, related_entity_id, created_at
        FROM notifications 
        WHERE related_entity_type = 'plant' 
        AND related_entity_id = ANY($1)
        AND created_at > NOW() - INTERVAL '10 minutes'
        ORDER BY created_at DESC
      `, [plantIds]);
      
      console.log(`Notifications for new plants: ${notifResult.rows.length}`);
      notifResult.rows.forEach(row => {
        console.log(`  - ${row.title} (Plant ID: ${row.related_entity_id}) - ${row.created_at}`);
      });
    }
    
    // 3. Cek apakah plant_welcome template ada
    console.log('\n3. CEK PLANT_WELCOME TEMPLATE:');
    const templateResult = await pool.query(`
      SELECT template_key, title_template, message_template
      FROM message_templates 
      WHERE template_key = 'plant_welcome'
    `);
    
    if (templateResult.rows.length > 0) {
      console.log('✅ plant_welcome template found:');
      console.log(`  Title: ${templateResult.rows[0].title_template}`);
      console.log(`  Message: ${templateResult.rows[0].message_template}`);
    } else {
      console.log('❌ plant_welcome template NOT found!');
    }
    
    // 4. Test manual plant notification
    console.log('\n4. TEST MANUAL PLANT NOTIFICATION:');
    try {
      // Cari plant terbaru untuk test
      const latestPlant = await pool.query(`
        SELECT id, name FROM plants ORDER BY created_at DESC LIMIT 1
      `);
      
      if (latestPlant.rows.length > 0) {
        const plant = latestPlant.rows[0];
        
        const testNotif = await pool.query(`
          INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id, is_read)
          VALUES (1, '🌱 Test Plant Notif', 'Test notifikasi untuk ${plant.name}', 'plant', 'plant', $1, false)
          RETURNING id, title, created_at
        `, [plant.id]);
        
        console.log(`✅ Test plant notification created: ID ${testNotif.rows[0].id}`);
        
        // Delete test notification
        await pool.query('DELETE FROM notifications WHERE id = $1', [testNotif.rows[0].id]);
        console.log('✅ Test notification deleted');
      }
    } catch (error) {
      console.log('❌ Manual test failed:', error.message);
    }
    
    // 5. Cek backend logs instructions
    console.log('\n5. BACKEND LOGS CHECK:');
    console.log('Cari logs ini di backend console saat tambah tanaman:');
    console.log('  - "DEBUG: Creating notifications for plant: [nama]"');
    console.log('  - "DEBUG: templateKey: plant_welcome"');
    console.log('  - "DEBUG: Notification created successfully: [id]"');
    console.log('  - "Template plant_welcome not found" (jika error)');
    
  } catch (error) {
    console.error('Debug error:', error.message);
  } finally {
    await pool.end();
  }
}

debugPlantNotification();
