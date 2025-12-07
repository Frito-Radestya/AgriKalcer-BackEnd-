import { checkAndCreateAllWateringReminders, generateNotificationsFromDueReminders } from './src/utils/wateringReminder.js';

async function runReminderCheck() {
  console.log('Starting reminder check...');
  
  try {
    await checkAndCreateAllWateringReminders();
    console.log('✅ Watering reminders checked');
    
    await generateNotificationsFromDueReminders();
    console.log('✅ Notifications from due reminders generated');
    
    console.log('🎉 Reminder check completed successfully!');
  } catch (error) {
    console.error('❌ Error during reminder check:', error);
  }
  
  process.exit(0);
}

runReminderCheck();
