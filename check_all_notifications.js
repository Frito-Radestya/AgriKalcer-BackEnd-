import { query } from './src/db.js';

async function checkAllNotifications() {
  try {
    const { rows } = await query(`
      SELECT n.*, p.name as plant_name, pt.name as plant_type_name, l.name as land_name
      FROM notifications n
      LEFT JOIN plants p ON n.related_entity_id = p.id AND n.related_entity_type = 'plant'
      LEFT JOIN plant_types pt ON p.plant_type_id = pt.id
      LEFT JOIN lands l ON p.land_id = l.id
      WHERE n.user_id = 1
      ORDER BY n.created_at DESC
      LIMIT 10
    `);
    
    console.log(`Found ${rows.length} notifications:`);
    rows.forEach(notif => {
      console.log(`\n📢 ${notif.title}`);
      console.log(`   Type: ${notif.type}`);
      console.log(`   Message: ${notif.message}`);
      console.log(`   Read: ${notif.is_read ? 'Yes' : 'No'}`);
      console.log(`   Plant: ${notif.plant_name || 'N/A'}`);
      console.log(`   Created: ${notif.created_at}`);
    });
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

checkAllNotifications();
