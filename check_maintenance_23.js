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

async function checkMaintenance() {
  try {
    console.log('🔍 Checking maintenance for tanggal 23...')
    
    // Cek maintenance dengan penyiraman/watering
    const maintenanceQuery = `
      SELECT m.*, p.name as plant_name, l.name as land_name
      FROM maintenance m
      LEFT JOIN plants p ON m.plant_id = p.id
      LEFT JOIN lands l ON p.land_id = l.id
      WHERE m.type ILIKE '%penyiraman%' OR m.type ILIKE '%watering%'
      ORDER BY m.scheduled_date DESC
    `
    
    const { rows: maintenance } = await pool.query(maintenanceQuery)
    console.log(`\n📋 Found ${maintenance.length} maintenance records:`)
    
    maintenance.forEach((m, index) => {
      console.log(`\n${index + 1}. ID: ${m.id}`)
      console.log(`   Type: ${m.type}`)
      console.log(`   Scheduled Date: ${m.scheduled_date}`)
      console.log(`   Plant: ${m.plant_name || 'N/A'}`)
      console.log(`   Land: ${m.land_name || 'N/A'}`)
      console.log(`   Status: ${m.status}`)
      console.log(`   Description: ${m.description || 'N/A'}`)
    })
    
    // Cek notifikasi yang terkait
    console.log('\n\n🔔 Checking related notifications...')
    const notificationQuery = `
      SELECT n.*, p.name as plant_name
      FROM notifications n
      LEFT JOIN plants p ON n.plant_id = p.id
      WHERE n.type IN ('watering', 'reminder_watering')
      OR n.title ILIKE '%penyiraman%' OR n.title ILIKE '%watering%'
      ORDER BY n.created_at DESC
      LIMIT 10
    `
    
    const { rows: notifications } = await pool.query(notificationQuery)
    console.log(`\n📬 Found ${notifications.length} related notifications:`)
    
    notifications.forEach((n, index) => {
      console.log(`\n${index + 1}. ID: ${n.id}`)
      console.log(`   Type: ${n.type}`)
      console.log(`   Title: ${n.title}`)
      console.log(`   Message: ${n.message}`)
      console.log(`   Plant: ${n.plant_name || 'N/A'}`)
      console.log(`   Read: ${n.read}`)
      console.log(`   Created: ${n.created_at}`)
    })
    
    // Cek khusus tanggal 23 November
    console.log('\n\n📅 Checking specific date (November 23, 2025)...')
    const dateQuery = `
      SELECT m.*, p.name as plant_name
      FROM maintenance m
      LEFT JOIN plants p ON m.plant_id = p.id
      WHERE DATE(m.scheduled_date) = '2025-11-23'
      AND (m.type ILIKE '%penyiraman%' OR m.type ILIKE '%watering%')
    `
    
    const { rows: dateMaintenance } = await pool.query(dateQuery)
    console.log(`\n📋 Found ${dateMaintenance.length} maintenance on Nov 23:`)
    
    dateMaintenance.forEach((m, index) => {
      console.log(`\n${index + 1}. ID: ${m.id}`)
      console.log(`   Type: ${m.type}`)
      console.log(`   Scheduled Date: ${m.scheduled_date}`)
      console.log(`   Plant: ${m.plant_name || 'N/A'}`)
    })
    
    // Cek notifikasi tanggal 23
    const notifDateQuery = `
      SELECT n.*, p.name as plant_name
      FROM notifications n
      LEFT JOIN plants p ON n.plant_id = p.id
      WHERE DATE(n.created_at) = '2025-11-23'
      AND (n.type IN ('watering', 'reminder_watering') 
           OR n.title ILIKE '%penyiraman%' 
           OR n.title ILIKE '%watering%')
    `
    
    const { rows: dateNotifications } = await pool.query(notifDateQuery)
    console.log(`\n📬 Found ${dateNotifications.length} notifications on Nov 23:`)
    
    dateNotifications.forEach((n, index) => {
      console.log(`\n${index + 1}. ID: ${n.id}`)
      console.log(`   Title: ${n.title}`)
      console.log(`   Created: ${n.created_at}`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await pool.end()
  }
}

checkMaintenance()
