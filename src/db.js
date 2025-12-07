import pg from 'pg';
const { Pool } = pg;

// Log database connection info
console.log('🔍 Initializing database connection...');
console.log('   Database host:', process.env.PGHOST || 'localhost');
console.log('   Database name:', process.env.PGDATABASE || 'not set');
console.log('   Using DATABASE_URL:', !!process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || undefined,
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT || 5432,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: process.env.PGSSL === 'true' ? { 
    rejectUnauthorized: false 
  } : false,
  max: 20, // max number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test the connection on startup
async function testConnection() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT NOW() as current_time');
    console.log('✅ Database connected successfully at', res.rows[0].current_time);
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
    process.exit(1);
  } finally {
    client.release();
  }
}

// Run the test
testConnection().catch(console.error);

// Handle connection errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV !== 'production') {
      console.log('📝 Query:', {
        text: text.split(' ').slice(0, 10).join(' ') + '...',
        duration: `${duration}ms`,
        rows: res.rowCount
      });
    }
    return res;
  } catch (error) {
    console.error('❌ Query error:', {
      text: text.split(' ').slice(0, 10).join(' ') + '...',
      error: error.message
    });
    throw error;
  }
}

// Add a method to check if tables exist
export async function checkTables() {
  const requiredTables = [
    'users', 'plants', 'harvests', 'lands', 
    'maintenance', 'notifications', 'reminders'
  ];
  
  try {
    const res = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    const existingTables = res.rows.map(row => row.table_name);
    const missingTables = requiredTables.filter(t => !existingTables.includes(t));
    
    if (missingTables.length > 0) {
      console.warn('⚠️  Missing tables:', missingTables.join(', '));
      return false;
    }
    
    console.log('✅ All required tables exist');
    return true;
  } catch (error) {
    console.error('❌ Error checking tables:', error.message);
    return false;
  }
}

export default { query, checkTables };
