/**
 * Helper functions for creating notifications from message templates and AI suggestions
 */

/**
 * Generate notification from message template
 * @param {Object} db - Database query function
 * @param {number} userId - User ID
 * @param {string} templateKey - Template key (reminder_watering, reminder_fertilizing, etc.)
 * @param {Object} variables - Variables to replace in template
 * @param {number} plantId - Plant ID (optional)
 */
export async function createNotificationFromTemplate(
  db,
  userId,
  templateKey,
  variables = {},
  plantId = null,
  relatedEntityType = null,
  relatedEntityId = null
) {
  try {
    console.log('DEBUG: createNotificationFromTemplate called')
    console.log('DEBUG: templateKey:', templateKey)
    console.log('DEBUG: userId:', userId)
    console.log('DEBUG: variables:', variables)
    console.log('DEBUG: plantId:', plantId)
    
    // Get template
    const { rows: templateRows } = await db.query(
      'SELECT * FROM message_templates WHERE template_key = $1',
      [templateKey]
    )
    
    console.log('DEBUG: templateRows.length:', templateRows.length)
    
    if (!templateRows.length) {
      console.error(`Template ${templateKey} not found`)
      return null
    }

    const template = templateRows[0]
    console.log('DEBUG: template found:', template.template_key)
    
    // Replace variables in title and message
    let title = template.title_template
    let message = template.message_template
    
    console.log('DEBUG: original title:', title)
    console.log('DEBUG: original message:', message)
    
    // Replace variables
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      title = title.replace(regex, variables[key])
      message = message.replace(regex, variables[key])
    })
    
    console.log('DEBUG: final title:', title)
    console.log('DEBUG: final message:', message)
    
    // Create notification
    const relType = relatedEntityType ?? (plantId ? 'plant' : null)
    const relId = relatedEntityId ?? plantId
    console.log('DEBUG: Creating notification with params:', { userId, title, message, relType, relId })
    
    const { rows } = await db.query(
      `INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id, is_read)
       VALUES ($1, $2, $3, 'info', $4, $5, false)
       RETURNING *`,
      [userId, title, message, relType, relId]
    )
    
    console.log('DEBUG: Notification created successfully:', rows[0].id)
    return rows[0]
  } catch (error) {
    console.error('Error creating notification from template:', error)
    console.error('Error stack:', error.stack)
    return null
  }
}

/**
 * Generate AI suggestion notifications
 * @param {Object} db - Database query function
 * @param {number} userId - User ID
 * @param {Object} plantData - Plant data for analysis
 */
export async function createAISuggestionNotification(db, userId, plantData = null) {
  try {
    // AI Suggestions based on conditions
    const suggestions = []
    
    // Check for plants that need attention
    if (plantData) {
      const { rows: plants } = await db.query(
        `SELECT p.*, 
                pt.name as plant_type_name,
                l.name as land_name
         FROM plants p
         LEFT JOIN plant_types pt ON p.plant_type_id = pt.id
         LEFT JOIN lands l ON p.land_id = l.id
         WHERE p.user_id = $1 AND p.status = 'active'
         ORDER BY p.planting_date ASC`,
        [userId]
      )
      
      // Suggestion 1: Check plants regularly
      if (plants.length > 0) {
        suggestions.push({
          title: 'Pantau Keadaan Tanaman',
          message: `Pantau keadaan ${plants.length} tanaman aktif Anda secara berkala. Periksa tanda-tanda hama, penyakit, atau kekurangan nutrisi.`,
          type: 'warning',
          priority: 'medium'
        })
      }
      
      // Suggestion 2: Check for overdue maintenance
      const { rows: overdueMaintenance } = await db.query(
        `SELECT COUNT(*) as count
         FROM maintenance m
         JOIN plants p ON m.plant_id = p.id
         WHERE p.user_id = $1
         AND m.date < CURRENT_DATE - INTERVAL '7 days'
         AND p.status = 'active'`,
        [userId]
      )
      
      if (parseInt(overdueMaintenance[0]?.count || 0) > 0) {
        suggestions.push({
          title: 'Perawatan Tertunda',
          message: `Anda memiliki ${overdueMaintenance[0].count} perawatan yang tertunda. Segera lakukan perawatan untuk menjaga kesehatan tanaman.`,
          type: 'warning',
          priority: 'high'
        })
      }
      
      // Suggestion 3: Weather/seasonal advice
      const currentMonth = new Date().getMonth() + 1
      if (currentMonth >= 10 || currentMonth <= 3) {
        suggestions.push({
          title: 'Musim Hujan',
          message: 'Musim hujan telah tiba. Perhatikan drainase lahan dan waspada terhadap penyakit jamur pada tanaman.',
          type: 'info',
          priority: 'medium'
        })
      }
      
      // Suggestion 4: Harvest planning
      const { rows: upcomingHarvests } = await db.query(
        `SELECT COUNT(*) as count
         FROM reminders r
         JOIN plants p ON r.plant_id = p.id
         WHERE p.user_id = $1
         AND r.type = 'harvest'
         AND r.status = 'pending'
         AND r.due_date BETWEEN NOW() AND NOW() + INTERVAL '14 days'`,
        [userId]
      )
      
      if (parseInt(upcomingHarvests[0]?.count || 0) > 0) {
        suggestions.push({
          title: 'Persiapan Panen',
          message: `Anda memiliki ${upcomingHarvests[0].count} tanaman yang akan panen dalam 2 minggu ke depan. Mulai persiapkan alat dan tenaga panen.`,
          type: 'success',
          priority: 'high'
        })
      }
    } else {
      // General suggestions
      suggestions.push({
        title: 'Tips Pertanian',
        message: 'Pantau keadaan tanaman Anda secara berkala. Waspada terhadap hama dan penyakit yang dapat menyerang tanaman.',
        type: 'info',
        priority: 'low'
      })
    }
    
    // Create notifications for suggestions (only if not already exists today)
    const today = new Date().toISOString().split('T')[0]
    for (const suggestion of suggestions) {
      // Check if similar notification already exists today
      const { rows: existing } = await db.query(
        `SELECT id FROM notifications 
         WHERE user_id = $1 
         AND title = $2 
         AND DATE(created_at) = $3
         AND related_entity_type = 'ai_suggestion'`,
        [userId, suggestion.title, today]
      )
      
      if (existing.length === 0) {
        await db.query(
          `INSERT INTO notifications (user_id, title, message, type, related_entity_type, is_read)
           VALUES ($1, $2, $3, $4, 'ai_suggestion', false)`,
          [userId, suggestion.title, suggestion.message, suggestion.type]
        )
      }
    }
    
    return suggestions.length
  } catch (error) {
    console.error('Error creating AI suggestion notifications:', error)
    return 0
  }
}

/**
 * Create weather-based suggestion notification from current weather condition
 * @param {Object} db - Database query function
 * @param {number} userId - User ID
 * @param {Object} weather - Weather info { main, description, temp }
 */
export async function createWeatherConditionNotification(db, userId, weather) {
  try {
    if (!weather || !weather.main) return 0

    const main = (weather.main || '').toLowerCase()
    const description = weather.description || ''
    const temp = weather.temp

    let title = 'Info Cuaca'
    let message = 'Periksa kondisi cuaca sebelum melakukan aktivitas di lahan.'

    if (main.includes('rain') || description.toLowerCase().includes('hujan')) {
      title = 'Cuaca Hujan - Atur Penyiraman'
      message = 'Saat ini cuaca hujan. Kurangi frekuensi penyiraman dan perhatikan potensi genangan air di lahan.'
    } else if (main.includes('clear') || description.toLowerCase().includes('cerah') || description.toLowerCase().includes('panas')) {
      title = 'Cuaca Panas / Cerah Terik'
      message = 'Cuaca sedang panas/cerah. Pastikan tanaman cukup air dan periksa gejala layu atau kekeringan.'
    } else if (main.includes('cloud') || description.toLowerCase().includes('berawan')) {
      title = 'Cuaca Berawan'
      message = 'Cuaca berawan. Ini waktu yang baik untuk melakukan aktivitas perawatan di lapangan karena tidak terlalu terik.'
    }

    const today = new Date().toISOString().split('T')[0]

    // Hindari notif ganda dengan judul yang sama di hari yang sama
    const { rows: existing } = await db.query(
      `SELECT id FROM notifications
       WHERE user_id = $1
         AND title = $2
         AND DATE(created_at) = $3
         AND related_entity_type = 'ai_suggestion'`,
      [userId, title, today]
    )

    if (existing.length > 0) return 0

    await db.query(
      `INSERT INTO notifications (user_id, title, message, type, related_entity_type, is_read)
       VALUES ($1, $2, $3, $4, 'ai_suggestion', false)`,
      [userId, title, message, 'info']
    )

    return 1
  } catch (error) {
    console.error('Error creating weather condition notification:', error)
    return 0
  }
}

/**
 * Generate maintenance reminder notifications from templates
 * @param {Object} db - Database query function
 * @param {number} userId - User ID
 * @param {number} plantId - Plant ID
 * @param {string} maintenanceType - Type: watering, fertilizing, weeding, pesticide
 * @param {Object} plantInfo - Plant information
 */
export async function createMaintenanceReminderNotification(db, userId, plantId, maintenanceType, plantInfo) {
  try {
    const templateMap = {
      'watering': 'reminder_watering',
      'fertilizing': 'reminder_fertilizing',
      'weeding': 'reminder_weeding',
      'pesticide': 'reminder_pesticide'
    }
    
    const templateKey = templateMap[maintenanceType]
    if (!templateKey) {
      console.error(`Unknown maintenance type: ${maintenanceType}`)
      return null
    }
    
    const variables = {
      plant_name: plantInfo.name || 'Tanaman'
    }
    
    return await createNotificationFromTemplate(db, userId, templateKey, variables, plantId)
  } catch (error) {
    console.error('Error creating maintenance reminder notification:', error)
    return null
  }
}

 

// Generate notifications from reminders using message templates (single source for bell & list)
// Idempotent per (user, reminder, day)
export async function generateNotificationsFromReminders(db, userId) {
  try {
    const today = new Date().toISOString().split('T')[0]
    const { rows: reminders } = await db.query(
      `SELECT r.*,
              p.id   AS plant_id,
              p.name AS plant_name,
              l.name AS land_name
       FROM reminders r
       LEFT JOIN plants p ON r.plant_id = p.id
       LEFT JOIN lands  l ON p.land_id = l.id
       WHERE r.user_id = $1
         AND COALESCE(r.active, true) = true
         AND COALESCE(r.status, 'pending') IN ('pending','due')
         AND DATE(r.due_date) <= $2
         AND (p.id IS NULL OR COALESCE(p.status, 'active') = 'active')`,
      [userId, today]
    )

    if (!reminders.length) return 0

    const typeToTemplate = {
      watering: 'reminder_watering',
      fertilizing: 'reminder_fertilizing',
      weeding: 'reminder_weeding',
      pesticide: 'reminder_pesticide',
      harvest: 'reminder_harvest',
    }

    let created = 0
    for (const r of reminders) {
      const templateKey = typeToTemplate[r.type]
      if (!templateKey) continue

      // Avoid duplicates per day (compare UTC date to be consistent)
      const { rows: existing } = await db.query(
        `SELECT id FROM notifications
         WHERE user_id = $1
           AND related_entity_type = 'reminder'
           AND related_entity_id = $2
           AND ((created_at AT TIME ZONE 'UTC')::date) = $3::date`,
        [userId, r.id, today]
      )
      if (existing.length) continue

      const variables = {
        plant_name: r.plant_name || 'Tanaman',
        land_name: r.land_name || 'Lahan',
        activity_description: r.type,
        watering_description: r.type === 'watering' ? (r.description || 'penyiraman') : (r.description || r.type),
        day: r.day || r.days_since_planting || '0',
      }

      const plantId = r.plant_id || null
      const res = await createNotificationFromTemplate(
        db,
        userId,
        templateKey,
        variables,
        plantId,
        'reminder',
        r.id
      )
      if (res) created += 1
    }

    return created
  } catch (err) {
    console.error('Error generating notifications from reminders:', err)
    return 0
  }
}

