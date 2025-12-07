import { query } from './src/db.js';
import { createNotificationFromTemplate } from './src/utils/notificationHelper.js';

// Scheduler function untuk notifikasi periodik
export async function runDailyNotificationScheduler() {
  try {
    console.log('📅 Running daily notification scheduler...');
    
    // Get all active plants
    const { rows: plants } = await query(`
      SELECT p.id, p.name, p.planting_date, p.user_id,
             pt.name as plant_type_name,
             pt.harvest_days,
             pt.watering_interval,
             l.name as land_name
      FROM plants p
      LEFT JOIN plant_types pt ON p.plant_type_id = pt.id
      LEFT JOIN lands l ON p.land_id = l.id
      WHERE p.status = 'active'
    `);

    console.log(`Found ${plants.length} active plants for scheduler`);

    for (const plant of plants) {
      const daysSincePlanting = Math.floor((new Date() - new Date(plant.planting_date)) / (1000 * 60 * 60 * 24));
      
      console.log(`\n🌱 Processing: ${plant.name} (${daysSincePlanting} days old)`);

      // 1. Plant Growth Notification (setiap 7 hari)
      if (daysSincePlanting > 0 && daysSincePlanting % 7 === 0) {
        try {
          await createNotificationFromTemplate(
            query,
            plant.user_id,
            'plant_growth',
            {
              plant_name: plant.name,
              days_since_planting: daysSincePlanting.toString()
            },
            plant.id,
            'plant'
          );
          console.log(`  📊 Generated growth notification (day ${daysSincePlanting})`);
        } catch (error) {
          console.log(`  ❌ Error growth notification: ${error.message}`);
        }
      }

      // 2. Plant Care Tips (setiap 10 hari)
      if (daysSincePlanting > 0 && daysSincePlanting % 10 === 0) {
        const careTips = [
          'Periksa kelembaban tanah secara rutin',
          'Beri pupuk kompos untuk nutrisi tambahan',
          'Perhatikan tanda-tanda penyakit pada daun',
          'Pastikan tanaman mendapat cukup sinar matahari',
          'Bersihkan gulma di sekitar tanaman',
          'Siram tanaman di pagi hari untuk hasil terbaik',
          'Periksa pH tanah secara berkala',
          'Lakukan rotasi tanaman untuk mencegah penyakit'
        ];
        const randomTip = careTips[Math.floor(Math.random() * careTips.length)];
        
        try {
          await createNotificationFromTemplate(
            query,
            plant.user_id,
            'plant_care_tip',
            {
              plant_name: plant.name,
              care_tip: randomTip
            },
            plant.id,
            'plant'
          );
          console.log(`  💡 Generated care tip (day ${daysSincePlanting})`);
        } catch (error) {
          console.log(`  ❌ Error care tip: ${error.message}`);
        }
      }

      // 3. Plant Health Alert (3 hari sebelum panen)
      if (plant.harvest_days && daysSincePlanting >= plant.harvest_days - 3 && daysSincePlanting <= plant.harvest_days) {
        try {
          await createNotificationFromTemplate(
            query,
            plant.user_id,
            'plant_health_alert',
            {
              plant_name: plant.name
            },
            plant.id,
            'plant'
          );
          console.log(`  ⚠️ Generated health alert (near harvest)`);
        } catch (error) {
          console.log(`  ❌ Error health alert: ${error.message}`);
        }
      }

      // 4. Reminder Fertilizing (setiap 14 hari)
      if (daysSincePlanting > 0 && daysSincePlanting % 14 === 0) {
        try {
          await createNotificationFromTemplate(
            query,
            plant.user_id,
            'reminder_fertilizing',
            {
              plant_name: plant.name
            },
            plant.id,
            'plant'
          );
          console.log(`  🌿 Generated fertilizing reminder (day ${daysSincePlanting})`);
        } catch (error) {
          console.log(`  ❌ Error fertilizing reminder: ${error.message}`);
        }
      }

      // 5. Reminder Weeding (setiap 7 hari)
      if (daysSincePlanting > 0 && daysSincePlanting % 7 === 0) {
        try {
          await createNotificationFromTemplate(
            query,
            plant.user_id,
            'reminder_weeding',
            {
              plant_name: plant.name
            },
            plant.id,
            'plant'
          );
          console.log(`  🔪 Generated weeding reminder (day ${daysSincePlanting})`);
        } catch (error) {
          console.log(`  ❌ Error weeding reminder: ${error.message}`);
        }
      }

      // 6. Reminder Pesticide (setiap 21 hari)
      if (daysSincePlanting > 0 && daysSincePlanting % 21 === 0) {
        try {
          await createNotificationFromTemplate(
            query,
            plant.user_id,
            'reminder_pesticide',
            {
              plant_name: plant.name
            },
            plant.id,
            'plant'
          );
          console.log(`  🐛 Generated pesticide reminder (day ${daysSincePlanting})`);
        } catch (error) {
          console.log(`  ❌ Error pesticide reminder: ${error.message}`);
        }
      }
    }

    console.log('\n✅ Daily notification scheduler completed!');
  } catch (error) {
    console.error('❌ Error in scheduler:', error);
  }
}
