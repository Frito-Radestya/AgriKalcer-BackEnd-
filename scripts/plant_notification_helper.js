// Helper untuk membuat notifikasi otomatis saat menambah tanaman

/**
 * Buat notifikasi untuk tanaman baru
 * @param {Object} db - Database connection
 * @param {number} userId - User ID
 * @param {Object} plantData - Data tanaman
 */
export async function createPlantNotifications(db, userId, plantData) {
  try {
    const { id: plantId, name, planting_date, plant_type, status } = plantData
    
    if (status !== 'active') return
    
    // 1. Notifikasi selamat datang tanaman baru
    await createNotificationFromTemplate(
      db, 
      userId, 
      'plant_welcome', 
      { 
        plant_name: name,
        planting_date: planting_date,
        plant_type: plant_type?.name || 'Tanaman'
      }, 
      plantId
    )
    
    // 2. Notifikasi penyiraman pertama (jika hari ini sama dengan planting_date)
    const today = new Date().toLocaleDateString('en-CA')
    const plantDate = new Date(planting_date).toLocaleDateString('en-CA')
    
    if (today === plantDate) {
      await createNotificationFromTemplate(
        db, 
        userId, 
        'first_watering', 
        { 
          plant_name: name,
          planting_date: planting_date
        }, 
        plantId
      )
    }
    
    // 3. Notifikasi pemupukan awal (3 hari setelah tanam)
    const fertilizingDate = new Date(planting_date)
    fertilizingDate.setDate(fertilizingDate.getDate() + 3)
    
    // Buat reminder untuk pemupukan
    await db.query(`
      INSERT INTO reminders (plant_id, type, title, message, due_date, status)
      VALUES ($1, 'fertilizing', 'Waktu Pemupukan', 'Saatnya memberikan pupuk awal untuk ${name}', $2, 'pending')
      ON CONFLICT (plant_id, type, due_date) DO NOTHING
    `, [plantId, fertilizingDate.toISOString().split('T')[0]])
    
    // 4. Notifikasi penyiangan (7 hari setelah tanam)
    const weedingDate = new Date(planting_date)
    weedingDate.setDate(weedingDate.getDate() + 7)
    
    await db.query(`
      INSERT INTO reminders (plant_id, type, title, message, due_date, status)
      VALUES ($1, 'weeding', 'Waktu Penyiangan', 'Saatnya membersihkan gulma di sekitar ${name}', $2, 'pending')
      ON CONFLICT (plant_id, type, due_date) DO NOTHING
    `, [plantId, weedingDate.toISOString().split('T')[0]])
    
    // 5. Notifikasi pestisida (14 hari setelah tanam)
    const pesticideDate = new Date(planting_date)
    pesticideDate.setDate(pesticideDate.getDate() + 14)
    
    await db.query(`
      INSERT INTO reminders (plant_id, type, title, message, due_date, status)
      VALUES ($1, 'pesticide', 'Cek Hama', 'Periksa tanda-tanda hama pada ${name}', $2, 'pending')
      ON CONFLICT (plant_id, type, due_date) DO NOTHING
    `, [plantId, pesticideDate.toISOString().split('T')[0]])
    
    console.log(`✅ Created notifications for plant ${name} (ID: ${plantId})`)
    
  } catch (error) {
    console.error('❌ Error creating plant notifications:', error)
  }
}

/**
 * Buat notifikasi penyiraman rutin
 * @param {Object} db - Database connection
 * @param {number} userId - User ID
 * @param {Object} plantData - Data tanaman
 * @param {number} interval - Interval penyiraman (hari)
 */
export async function createWateringReminder(db, userId, plantData, interval = 2) {
  try {
    const { id: plantId, name, planting_date } = plantData
    
    // Hitung tanggal penyiraman berikutnya
    const lastWatering = new Date(planting_date)
    const nextWatering = new Date(lastWatering)
    nextWatering.setDate(nextWatering.getDate() + interval)
    
    // Buat reminder penyiraman
    await db.query(`
      INSERT INTO reminders (plant_id, type, title, message, due_date, status)
      VALUES ($1, 'watering', 'Jadwal Penyiraman', 'Saatnya menyiram ${name}', $2, 'pending')
      ON CONFLICT (plant_id, type, due_date) DO NOTHING
    `, [plantId, nextWatering.toISOString().split('T')[0]])
    
    // Buat notifikasi jika penyiraman harus dilakukan hari ini
    const today = new Date().toLocaleDateString('en-CA')
    const wateringDate = nextWatering.toLocaleDateString('en-CA')
    
    if (today === wateringDate) {
      await createNotificationFromTemplate(
        db, 
        userId, 
        'reminder_watering', 
        { 
          plant_name: name,
          days_since_planting: Math.floor((new Date() - new Date(planting_date)) / (1000 * 60 * 60 * 24))
        }, 
        plantId
      )
    }
    
  } catch (error) {
    console.error('❌ Error creating watering reminder:', error)
  }
}

// Import helper function
async function createNotificationFromTemplate(db, userId, templateKey, variables = {}, plantId = null) {
  try {
    // Get template
    const { rows: templateRows } = await db.query(
      'SELECT * FROM message_templates WHERE template_key = $1',
      [templateKey]
    )
    
    if (!templateRows.length) {
      console.error(`Template ${templateKey} not found`)
      return
    }
    
    const template = templateRows[0]
    
    // Replace variables in template
    let title = template.title
    let message = template.message
    
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`
      title = title.replace(new RegExp(placeholder, 'g'), value)
      message = message.replace(new RegExp(placeholder, 'g'), value)
    })
    
    // Create notification
    const { rows: notificationRows } = await db.query(
      `INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id, is_read)
       VALUES ($1, $2, $3, 'reminder', 'plant', $4, false)
       RETURNING *`,
      [userId, title, message, plantId]
    )
    
    return notificationRows[0]
  } catch (error) {
    console.error('Error creating notification from template:', error)
  }
}

export { createNotificationFromTemplate }
