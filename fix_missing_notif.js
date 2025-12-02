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

async function fixMissingNotif() {
  try {
    console.log('🔧 Creating missing notification for maintenance ID 1...')
    
    // Create notification for maintenance watering on Nov 23
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
    const plantInfo = plants[0]
    
    const variables = {
      name: plantInfo.name,
      landName: plantInfo.land_name,
      wateringDescription: plantInfo.watering_interval ? `setiap ${plantInfo.watering_interval} hari` : 'secara berkala',
      activityDescription: maintenanceType,
      day: Math.floor((new Date('2025-11-23') - new Date(plantInfo.planting_date || new Date())) / (1000 * 60 * 60 * 24))
    }
    
    console.log('📝 Creating notification with variables:', variables)
    
    const result = await createMaintenanceReminderNotification(
      pool, 
      userId, 
      plantId, 
      maintenanceType, 
      variables
    )
    
    console.log('✅ Missing notification created:', result)
    
    // Update created_at to match maintenance date
    const updateQuery = `
      UPDATE notifications 
      SET created_at = '2025-11-23 15:30:25', updated_at = '2025-11-23 15:30:25'
      WHERE id = $1
    `
    
    await pool.query(updateQuery, [result.id])
    console.log('📅 Updated notification timestamp to match maintenance date')
    
    // Verify
    const verifyQuery = `
      SELECT * FROM notifications 
      WHERE id = $1
    `
    
    const { rows: verify } = await pool.query(verifyQuery, [result.id])
    console.log('🔍 Verification:', verify[0])
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await pool.end()
  }
}

fixMissingNotif()
