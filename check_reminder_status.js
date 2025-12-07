import { query } from './src/db.js';

async function checkReminderStatus() {
  try {
    const { rows } = await query('SELECT DISTINCT status FROM reminders');
    console.log('Available reminder statuses:');
    rows.forEach(row => console.log(`- ${row.status}`));
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

checkReminderStatus();
