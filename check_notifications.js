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

async function checkNotifications() {
  try {
    console.log('🔍 Checking notifications for maintenance ID 1...')
    
    // Cek notifikasi yang terkait dengan maintenance watering
    const notifQuery = `
      SELECT n.*, p.name as plant_name
      FROM notifications n
      LEFT JOIN plants p ON n.plant_id = p.id
      WHERE n.type IN ('watering', 'reminder_watering')
      OR n.title ILIKE '%penyiraman%' OR n.title ILIKE '%watering%'
      ORDER BY n.created_at DESC
      LIMIT 10
    `
    
    const { rows: notifications } = await pool.query(notifQuery)
    console.log(`\n📬 Found ${notifications.length} watering notifications:`)
    
    notifications.forEach((n, index) => {
      console.log(`\n${index + 1}. ID: ${n.id}`)
      console.log(`   Type: ${n.type}`)
      console.log(`   Title: ${n.title}`)
      console.log(`   Message: ${n.message}`)
      console.log(`   Plant: ${n.plant_name || 'N/A'}`)
      console.log(`   Read: ${n.read}`)
      console.log(`   Created: ${n.created_at}`)
    })
    
    // Cek semua notifikasi tanggal 23
    console.log('\n\n📅 All notifications on Nov 23:')
    const dateQuery = `
      SELECT n.*, p.name as plant_name
      FROM notifications n
      LEFT JOIN plants p ON n.plant_id = p.id
      WHERE DATE(n.created_at) = '2025-11-23'
      ORDER BY n.created_at DESC
    `
    
    const { rows: dateNotifications } = await pool.query(dateQuery)
    console.log(`\n📬 Found ${dateNotifications.length} notifications on Nov 23:`)
    
    dateNotifications.forEach((n, index) => {
      console.log(`\n${index + 1}. ID: ${n.id}`)
      console.log(`   Type: ${n.type}`)
      console.log(`   Title: ${n.title}`)
      console.log(`   Message: ${n.message}`)
      console.log(`   Plant: ${n.plant_name || 'N/A'}`)
      console.log(`   Read: ${n.read}`)
      console.log(`   Created: ${n.created_at}`)
    })
    
    // Cek maintenance notification creation logic
    console.log('\n\n🔧 Checking notification creation process...')
    console.log('Maintenance record found:')
    console.log('- ID: 1')
    console.log('- Type: watering') 
    console.log('- Date: 2025-11-23')
    console.log('- Plant ID: 1')
    console.log('- Created: 2025-11-23 15:30:20')
    
    console.log('\n❓ Expected notification should be created when maintenance was added...')
    console.log('Let me check the notification creation code in maintenance route...')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await pool.end()
  }
}

checkNotifications()
