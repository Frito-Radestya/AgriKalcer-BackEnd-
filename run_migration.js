import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'agri_db',
  password: process.env.DB_PASSWORD || 'yourpassword',
  port: process.env.DB_PORT || 5432,
};

async function runMigration() {
  const client = new pg.Client(dbConfig);
  
  try {
    await client.connect();
    console.log('Connected to database');
    
    // Read SQL file
    const sql = readFileSync(join(__dirname, 'migrations', 'create_otp_codes_table.sql'), 'utf8');
    
    // Run migration
    await client.query(sql);
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error running migration:', error);
  } finally {
    await client.end();
  }
}

runMigration();
