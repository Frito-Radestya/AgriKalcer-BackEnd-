import dotenv from 'dotenv'
dotenv.config()
import pkg from 'pg'
const { Pool } = pkg
import { createMaintenanceReminderNotification } from './src/utils/notificationHelper.js'

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

async function testMaintenanceNotif() {
  try {
    console.log('🧪 Testing maintenance notification creation...')
    
    // Test data based on maintenance ID 1
    const userId = 1
    const plantId = 1
    const maintenanceType = 'watering'
    
    // Get plant info
    const plantQuery = `
      SELECT p.*, l.name as land_name
      FROM plants p
      LEFT JOIN lands l ON p.land_id = l.id
      WHERE p.id = $1
    `
    
    const { rows: plants } = await pool.query(plantQuery, [plantId])
    
    if (plants.length === 0) {
      console.log('❌ Plant not found')
      return
    }
    
    const plantInfo = plants[0]
    console.log('📋 Plant info:', plantInfo)
    
    // Try to create notification
    console.log('\n🔧 Creating maintenance reminder notification...')
    
    const variables = {
      name: plantInfo.name,
      landName: plantInfo.land_name,
      wateringDescription: plantInfo.watering_interval ? `setiap ${plantInfo.watering_interval} hari` : 'secara berkala',
      activityDescription: maintenanceType,
      day: Math.floor((new Date() - new Date(plantInfo.planting_date || new Date())) / (1000 * 60 * 60 * 24))
    }
    
    console.log('📝 Variables:', variables)
    
    const result = await createMaintenanceReminderNotification(
      pool, 
      userId, 
      plantId, 
      maintenanceType, 
      variables
    )
    
    console.log('✅ Notification created:', result)
    
    // Check if notification exists
    const checkQuery = `
      SELECT * FROM notifications 
      WHERE type = 'reminder_watering' 
      AND user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 5
    `
    
    const { rows: notifs } = await pool.query(checkQuery, [userId])
    console.log(`\n📬 Found ${notifs.length} reminder_watering notifications:`)
    
    notifs.forEach((n, index) => {
      console.log(`\n${index + 1}. ID: ${n.id}`)
      console.log(`   Title: ${n.title}`)
      console.log(`   Message: ${n.message}`)
      console.log(`   Type: ${n.type}`)
      console.log(`   Created: ${n.created_at}`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await pool.end()
  }
}

testMaintenanceNotif()
