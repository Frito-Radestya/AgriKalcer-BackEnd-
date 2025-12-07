import { query } from './src/db.js';

async function checkNotificationsTable() {
  try {
    const { rows } = await query(
      'SELECT column_name, data_type FROM information_schema.columns WHERE table_name = \'notifications\' ORDER BY ordinal_position'
    );
    console.log('Notifications table structure:');
    rows.forEach(col => console.log(`- ${col.column_name}: ${col.data_type}`));
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

checkNotificationsTable();
