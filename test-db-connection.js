import dotenv from 'dotenv'
dotenv.config()
import pkg from 'pg'
const { Pool } = pkg

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

async function testConnection() {
  try {
    console.log('Testing database connection...')
    console.log('Config:', {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD ? '***' : 'undefined'
    })
    
    const res = await pool.query('SELECT 1 as test')
    console.log('✅ Database connected successfully!')
    console.log('Result:', res.rows[0])
    
    await pool.end()
  } catch (error) {
    console.error('❌ Database connection failed:')
    console.error('Error:', error.message)
    console.error('Code:', error.code)
    
    await pool.end()
  }
}

testConnection()
