// Quick Database Clear Script
// Run with: node quick_clear.js

import { Pool } from 'pg'

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'agri_db',
  user: 'postgres',
  password: 'your_password', // Ganti dengan password kamu
})

async function clearUserData(userId) {
  console.log(`🗑️  Clearing data for user ${userId}...`)
  
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')
    
    // Hapus dalam urutan yang benar untuk menghindari foreign key conflicts
    const tables = [
      'notifications',
      'productivity_metrics', 
      'reminders',
      'harvests',
      'finances',
      'maintenance',
      'plants',
      'lands'
    ]
    
    for (const table of tables) {
      const result = await client.query(
        `DELETE FROM ${table} WHERE user_id = $1`,
        [userId]
      )
      console.log(`✅ Deleted ${result.rowCount} rows from ${table}`)
    }
    
    await client.query('COMMIT')
    console.log(`✅ Successfully cleared all data for user ${userId}`)
    
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ Error clearing data:', error)
  } finally {
    client.release()
  }
}

async function clearAllData() {
  console.log('🗑️  Clearing ALL data (except users and plant_types)...')
  
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')
    
    const tables = [
      'notifications',
      'productivity_metrics',
      'reminders', 
      'harvests',
      'finances',
      'maintenance',
      'plants',
      'lands'
    ]
    
    for (const table of tables) {
      const result = await client.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`)
      console.log(`✅ Truncated ${table}`)
    }
    
    await client.query('COMMIT')
    console.log('✅ Successfully cleared all data')
    
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ Error clearing data:', error)
  } finally {
    client.release()
  }
}

async function showDataCount() {
  console.log('📊 Current data count:')
  
  const tables = [
    'plants', 'maintenance', 'harvests', 'finances', 
    'lands', 'notifications', 'reminders', 'productivity_metrics'
  ]
  
  for (const table of tables) {
    const result = await pool.query(`SELECT COUNT(*) as count FROM ${table}`)
    console.log(`${table}: ${result.rows[0].count}`)
  }
}

// Command line interface
const command = process.argv[2]
const userId = process.argv[3]

async function main() {
  try {
    if (command === 'user' && userId) {
      await clearUserData(parseInt(userId))
    } else if (command === 'all') {
      await clearAllData()
    } else if (command === 'count') {
      await showDataCount()
    } else {
      console.log(`
📋 Usage:
  node quick_clear.js user <user_id>    # Clear data for specific user
  node quick_clear.js all               # Clear ALL data
  node quick_clear.js count             # Show current data count

⚠️  WARNING: This will permanently delete data!
      `)
    }
  } finally {
    await pool.end()
  }
}

main().catch(console.error)
