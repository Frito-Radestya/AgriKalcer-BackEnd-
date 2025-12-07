import { query } from './src/db.js';

async function checkRemindersTable() {
  try {
    const { rows } = await query(
      'SELECT column_name, data_type FROM information_schema.columns WHERE table_name = \'reminders\' ORDER BY ordinal_position'
    );
    console.log('Reminders table structure:');
    rows.forEach(col => console.log(`- ${col.column_name}: ${col.data_type}`));
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

checkRemindersTable();
