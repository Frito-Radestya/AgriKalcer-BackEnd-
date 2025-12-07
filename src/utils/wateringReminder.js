import db from '../db.js'

/**
 * Create automatic watering reminder based on plant's watering interval
 * @param {number} userId - User ID
 * @param {number} plantId - Plant ID
 * @param {Date} lastWateringDate - Last watering date
 * @param {number} wateringInterval - Watering interval in days
 * @param {Object} plantInfo - Plant information
 */
export async function createWateringReminder(userId, plantId, lastWateringDate, wateringInterval, plantInfo) {
  try {
    if (!wateringInterval || wateringInterval <= 0) {
      console.log(`No watering interval set for plant ${plantId}`)
      return null
    }

    // Calculate next watering date
    const nextWateringDate = new Date(lastWateringDate)
    nextWateringDate.setDate(nextWateringDate.getDate() + wateringInterval)
    
    // Only create reminder if it's in the future
    if (nextWateringDate <= new Date()) {
      console.log(`Next watering date is in the past for plant ${plantId}`)
      return null
    }

    // Check if reminder already exists
    const { rows: existing } = await db.query(
      `SELECT id FROM reminders 
       WHERE plant_id = $1 
       AND type = 'watering'
       AND status = 'pending'
       AND due_date = $2`,
      [plantId, nextWateringDate.toISOString().split('T')[0]]
    )
    
    if (existing.length > 0) {
      console.log(`Watering reminder already exists for plant ${plantId} on ${nextWateringDate.toISOString().split('T')[0]}`)
      return existing[0]
    }

    // Create new reminder
    const title = `Pengingat Penyiraman: ${plantInfo.name}`
    const message = plantInfo.landName 
      ? `Tanaman ${plantInfo.name} di lahan ${plantInfo.land_name} perlu disiram lagi pada ${nextWateringDate.toLocaleDateString('id-ID')}`
      : `Tanaman ${plantInfo.name} perlu disiram lagi pada ${nextWateringDate.toLocaleDateString('id-ID')}`

    const { rows } = await db.query(
      `INSERT INTO reminders (user_id, plant_id, type, description, due_date, status, days_since_planting)
       VALUES ($1, $2, 'watering', $3, $4, 'pending', $5)
       RETURNING *`,
      [userId, plantId, message, nextWateringDate.toISOString().split('T')[0], Math.floor((new Date() - new Date()) / (1000 * 60 * 60 * 24))]
    )

    console.log(`Created watering reminder for plant ${plantId} on ${nextWateringDate.toISOString().split('T')[0]}`)
    return rows[0]
  } catch (error) {
    console.error('Error creating watering reminder:', error)
    return null
  }
}

/**
 * Check and create watering reminders for all active plants
 * This should be called daily (e.g., via cron job)
 */
export async function checkAndCreateAllWateringReminders() {
  try {
    console.log('Checking all plants for watering reminders...')
    
    // Get all active plants with watering intervals
    const { rows: plants } = await db.query(`
      SELECT p.id, p.user_id, p.name, p.planting_date,
             l.name as land_name,
             pt.watering_interval,
             MAX(m.date) as last_watering_date
      FROM plants p
      LEFT JOIN lands l ON p.land_id = l.id
      LEFT JOIN plant_types pt ON p.plant_type_id = pt.id
      LEFT JOIN maintenance m ON p.id = m.plant_id AND m.type = 'penyiraman'
      WHERE p.status = 'active'
      AND pt.watering_interval IS NOT NULL
      AND pt.watering_interval > 0
      GROUP BY p.id, p.user_id, p.name, p.planting_date, l.name, pt.watering_interval
    `)

    console.log(`Found ${plants.length} plants to check`)

    for (const plant of plants) {
      const lastWateringDate = plant.last_watering_date 
        ? new Date(plant.last_watering_date)
        : new Date(plant.planting_date) // Use planting date if no watering history

      await createWateringReminder(
        plant.user_id,
        plant.id,
        lastWateringDate,
        plant.watering_interval,
        {
          name: plant.name,
          landName: plant.land_name
        }
      )
    }

    console.log('Watering reminder check completed')
  } catch (error) {
    console.error('Error in checkAndCreateAllWateringReminders:', error)
  }
}

/**
 * Generate notifications from due reminders
 * This should be called daily to convert due reminders into notifications
 */
export async function generateNotificationsFromDueReminders() {
  try {
    console.log('Checking for due reminders...')
    
    const today = new Date().toISOString().split('T')[0]
    
    // Get all due reminders for active plants (or global reminders without plant)
    const { rows: reminders } = await db.query(`
      SELECT r.*, u.email, p.name as plant_name, l.name as land_name
      FROM reminders r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN plants p ON r.plant_id = p.id
      LEFT JOIN lands l ON p.land_id = l.id
      WHERE r.due_date <= $1
      AND r.status = 'pending'
      AND (p.id IS NULL OR COALESCE(p.status, 'active') = 'active')
    `, [today])

    console.log(`Found ${reminders.length} due reminders`)

    for (const reminder of reminders) {
      // Create notification using description field
      const title = `Pengingat ${reminder.type === 'watering' ? 'Penyiraman' : 'Perawatan'}`
      await db.query(`
        INSERT INTO notifications (user_id, type, title, message, related_entity_type, related_entity_id, is_read, created_at)
        VALUES ($1, 'reminder', $2, $3, $4, $5, false, NOW())
      `, [
        reminder.user_id,
        title,
        reminder.description || `${reminder.type} reminder`,
        'reminder',
        reminder.id
      ])

      // Mark reminder as completed
      await db.query(
        'UPDATE reminders SET status = \'done\' WHERE id = $1',
        [reminder.id]
      )

      console.log(`Created notification for reminder: ${title}`)
    }

    console.log('Due reminders processing completed')
  } catch (error) {
    console.error('Error in generateNotificationsFromDueReminders:', error)
  }
}
