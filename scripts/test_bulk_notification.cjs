// Test bulk notification API
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'agri_db',
  password: 'admin',
  port: 5432
});

async function testBulkNotification() {
  try {
    console.log('=== TEST BULK NOTIFICATION API ===');
    
    // 1. Cek unread notifications
    console.log('\n1. CEK UNREAD NOTIFICATIONS:');
    const unreadResult = await pool.query(`
      SELECT id, title, is_read, read
      FROM notifications 
      WHERE user_id = 1 
      AND (is_read = false OR is_read IS NULL OR read = false OR read IS NULL)
      ORDER BY created_at DESC
    `);
    
    console.log(`Unread notifications: ${unreadResult.rows.length}`);
    unreadResult.rows.forEach(row => {
      console.log(`  - ID: ${row.id}, Title: ${row.title}, is_read: ${row.is_read}, read: ${row.read}`);
    });
    
    // 2. Test bulk update query
    if (unreadResult.rows.length > 0) {
      console.log('\n2. TEST BULK UPDATE QUERY:');
      
      // Check table structure
      const { rows: checkCols } = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'notifications' 
        AND column_name IN ('is_read', 'read')
      `);
      
      const hasNewSchema = checkCols.some(col => col.column_name === 'is_read');
      console.log(`Table schema: ${hasNewSchema ? 'new (is_read)' : 'old (read)'}`);
      
      // Test bulk update
      let updateResult;
      if (hasNewSchema) {
        updateResult = await pool.query(
          `UPDATE notifications SET 
            is_read = true,
            read_at = COALESCE(read_at, NOW()),
            updated_at = CURRENT_TIMESTAMP
           WHERE user_id=$1 AND is_read = false
           RETURNING id, title, is_read, read_at`,
          [1]
        );
      } else {
        updateResult = await pool.query(
          `UPDATE notifications SET 
            read = true,
            read_at = COALESCE(read_at, NOW())
           WHERE user_id=$1 AND read = false
           RETURNING id, title, read, read_at`,
          [1]
        );
      }
      
      console.log(`Updated ${updateResult.rows.length} notifications`);
      updateResult.rows.forEach(row => {
        console.log(`  - ID: ${row.id}, Title: ${row.title}, Status: Updated`);
      });
      
      // 3. Verify update
      console.log('\n3. VERIFY UPDATE:');
      const verifyResult = await pool.query(`
        SELECT id, title, is_read, read
        FROM notifications 
        WHERE user_id = 1 
        ORDER BY created_at DESC
        LIMIT 5
      `);
      
      console.log('Recent notifications after update:');
      verifyResult.rows.forEach(row => {
        console.log(`  - ID: ${row.id}, Title: ${row.title}, is_read: ${row.is_read}, read: ${row.read}`);
      });
      
    } else {
      console.log('No unread notifications to test with');
    }
    
    // 4. Test API endpoint info
    console.log('\n4. API ENDPOINT TEST:');
    console.log('Test this in browser or curl:');
    console.log('PUT http://localhost:4001/api/notifications/mark-all-read');
    console.log('Headers: Authorization: Bearer <your-token>');
    console.log('Body: {} (empty)');
    
  } catch (error) {
    console.error('Test error:', error.message);
  } finally {
    await pool.end();
  }
}

testBulkNotification();
