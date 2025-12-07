import { query } from './src/db.js';
import { createNotificationFromTemplate } from './src/utils/notificationHelper.js';

async function demoAllNotifications() {
  try {
    console.log('🎯 Generating demo notifications for all templates...');
    
    const userId = 1;
    const plantId = 8; // jagung cuy
    
    const templates = [
      { key: 'first_watering', vars: { plant_name: 'jagung cuy' } },
      { key: 'plant_care_tip', vars: { plant_name: 'jagung cuy', care_tip: 'Periksa kelembaban tanah secara rutin untuk hasil terbaik' } },
      { key: 'plant_growth', vars: { plant_name: 'jagung cuy', days_since_planting: '7' } },
      { key: 'plant_health_alert', vars: { plant_name: 'jagung cuy' } },
      { key: 'plant_welcome', vars: { plant_name: 'jagung cuy', plant_type: 'Jagung', planting_date: '2025-12-01' } },
      { key: 'reminder_fertilizing', vars: { plant_name: 'jagung cuy' } },
      { key: 'reminder_harvest', vars: { plant_name: 'jagung cuy' } },
      { key: 'reminder_pesticide', vars: { plant_name: 'jagung cuy' } },
      { key: 'reminder_watering', vars: { plant_name: 'jagung cuy' } },
      { key: 'reminder_weeding', vars: { plant_name: 'jagung cuy' } }
    ];

    for (const template of templates) {
      await createNotificationFromTemplate(
        query,
        userId,
        template.key,
        template.vars,
        plantId,
        'plant'
      );
      console.log(`✅ Generated: ${template.key}`);
    }

    console.log('\n🎉 All demo notifications generated!');
    console.log('📱 Refresh your frontend to see all notification types');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  process.exit(0);
}

demoAllNotifications();
