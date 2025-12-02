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

async function checkNotifStructure() {
  try {
    console.log('🔍 Checking notifications table structure...')
    
    const structureQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'notifications'
      ORDER BY ordinal_position
    `
    
    const { rows: columns } = await pool.query(structureQuery)
    console.log('\n📋 Notifications table columns:')
    columns.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable})`)
    })
    
    // Cek semua notifikasi
    console.log('\n📋 All notifications data:')
    const dataQuery = `
      SELECT * FROM notifications 
      ORDER BY created_at DESC
      LIMIT 10
    `
    
    const { rows: data } = await pool.query(dataQuery)
    console.log(`\nFound ${data.length} notification records:`)
    
    data.forEach((n, index) => {
      console.log(`\n${index + 1}. ID: ${n.id}`)
      Object.keys(n).forEach(key => {
        console.log(`   ${key}: ${n[key]}`)
      })
    })
    
    // Cek maintenance notification creation
    console.log('\n\n🔧 Checking if notification was created for maintenance ID 1...')
    const maintenanceNotifQuery = `
      SELECT * FROM notifications 
      WHERE type IN ('watering', 'reminder_watering')
      OR title ILIKE '%penyiraman%' 
      OR title ILIKE '%watering%'
      ORDER BY created_at DESC
    `
    
    const { rows: maintenanceNotifs } = await pool.query(maintenanceNotifQuery)
    console.log(`\n📬 Found ${maintenanceNotifs.length} maintenance-related notifications:`)
    
    maintenanceNotifs.forEach((n, index) => {
      console.log(`\n${index + 1}. ID: ${n.id}`)
      console.log(`   Type: ${n.type}`)
      console.log(`   Title: ${n.title}`)
      console.log(`   Message: ${n.message}`)
      console.log(`   Read: ${n.read}`)
      console.log(`   Created: ${n.created_at}`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await pool.end()
  }
}

checkNotifStructure()
