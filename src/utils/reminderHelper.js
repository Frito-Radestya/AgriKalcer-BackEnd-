/**
 * Helper functions for creating reminders for upcoming harvests
 */

/**
 * Create reminder for plant harvest (7 days before estimated harvest date)
 * @param {Object} db - Database query function
 * @param {number} plantId - Plant ID
 * @param {Date} estimatedHarvestDate - Estimated harvest date
 * @param {string} plantName - Plant name
 * @param {string} landName - Land name (optional)
 */
export async function createHarvestReminder(db, plantId, estimatedHarvestDate, plantName, landName = null) {
  try {
    // Calculate reminder date (7 days before harvest)
    const reminderDate = new Date(estimatedHarvestDate)
    reminderDate.setDate(reminderDate.getDate() - 7)
    
    // Only create reminder if it's in the future
    if (reminderDate <= new Date()) {
      return null
    }
    
    const title = `Pengingat Panen: ${plantName}`
    const message = landName 
      ? `Tanaman ${plantName} di lahan ${landName} akan siap panen dalam 7 hari (${estimatedHarvestDate.toISOString().split('T')[0]})`
      : `Tanaman ${plantName} akan siap panen dalam 7 hari (${estimatedHarvestDate.toISOString().split('T')[0]})`
    
    // Check if reminder already exists
    const { rows: existing } = await db.query(
      `SELECT id FROM reminders 
       WHERE plant_id = $1 
       AND type = 'harvest' 
       AND status = 'pending'
       AND due_date = $2`,
      [plantId, reminderDate.toISOString().split('T')[0]]
    )
    
    if (existing.length > 0) {
      return existing[0] // Return existing reminder
    }
    
    // Create new reminder
    const { rows } = await db.query(
      `INSERT INTO reminders (plant_id, type, title, message, due_date, status)
       VALUES ($1, 'harvest', $2, $3, $4, 'pending')
       RETURNING *`,
      [plantId, title, message, reminderDate.toISOString().split('T')[0]]
    )
    
    return rows[0]
  } catch (error) {
    console.error('Error creating harvest reminder:', error)
    return null
  }
}

/**
 * Update or create reminder when plant is updated
 * @param {Object} db - Database query function
 * @param {number} plantId - Plant ID
 * @param {Date} estimatedHarvestDate - New estimated harvest date
 * @param {string} plantName - Plant name
 * @param {string} landName - Land name (optional)
 */
export async function updateHarvestReminder(db, plantId, estimatedHarvestDate, plantName, landName = null) {
  try {
    // Delete old pending reminders for this plant
    await db.query(
      `DELETE FROM reminders 
       WHERE plant_id = $1 
       AND type = 'harvest' 
       AND status = 'pending'`,
      [plantId]
    )
    
    // Create new reminder with updated date
    return await createHarvestReminder(db, plantId, estimatedHarvestDate, plantName, landName)
  } catch (error) {
    console.error('Error updating harvest reminder:', error)
    return null
  }
}

/**
 * Calculate estimated harvest date based on planting date and plant type
 * @param {Date} plantingDate - Planting date
 * @param {number} harvestDays - Days until harvest (from plant_types)
 * @returns {Date} Estimated harvest date
 */
export function calculateEstimatedHarvestDate(plantingDate, harvestDays = 60) {
  // Ensure plantingDate is treated as local date to avoid timezone issues
  console.log('DEBUG: calculateEstimatedHarvestDate - Input plantingDate:', plantingDate)
  console.log('DEBUG: calculateEstimatedHarvestDate - Input harvestDays:', harvestDays)
  console.log('DEBUG: calculateEstimatedHarvestDate - Type of plantingDate:', typeof plantingDate)
  
  // Handle both string and Date input
  let dateObj
  if (typeof plantingDate === 'string') {
    // Parse YYYY-MM-DD format as local date
    const parts = plantingDate.split('-')
    if (parts.length === 3) {
      // Create date using local time (year, month-1, day)
      dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
    } else {
      // Fallback to regular parsing
      dateObj = new Date(plantingDate)
    }
  } else {
    dateObj = plantingDate
  }
  
  console.log('DEBUG: calculateEstimatedHarvestDate - Date object created:', dateObj)
  console.log('DEBUG: calculateEstimatedHarvestDate - Is valid date:', !isNaN(dateObj.getTime()))
  
  if (isNaN(dateObj.getTime())) {
    console.error('DEBUG: Invalid date input!')
    return null
  }
  
  // Add days using local time
  dateObj.setDate(dateObj.getDate() + harvestDays)
  
  console.log('DEBUG: calculateEstimatedHarvestDate - Result harvestDate:', dateObj)
  console.log('DEBUG: calculateEstimatedHarvestDate - Result formatted:', dateObj.toISOString().split('T')[0])
  
  return dateObj
}

