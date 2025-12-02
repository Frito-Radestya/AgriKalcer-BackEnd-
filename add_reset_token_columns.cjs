const db = require('./src/db.js');

async function addResetTokenColumns() {
  try {
    console.log('🔧 Adding reset_token columns to users table...');
    
    // Add reset_token column
    await db.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255)
    `);
    console.log('✅ reset_token column added');
    
    // Add reset_token_expiry column
    await db.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP
    `);
    console.log('✅ reset_token_expiry column added');
    
    console.log('🎉 Reset token columns added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addResetTokenColumns();
