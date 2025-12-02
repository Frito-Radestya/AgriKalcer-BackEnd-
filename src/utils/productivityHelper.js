/**
 * Helper functions for creating/updating productivity metrics
 */

/**
 * Create productivity metric for active plant
 * @param {Object} db - Database query function
 * @param {number} userId - User ID
 * @param {number} plantId - Plant ID
 * @param {string} status - Plant status (active, harvested, etc.)
 */
export async function createProductivityMetric(db, userId, plantId, status = 'active') {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    // Check if metric already exists for today
    const { rows: existing } = await db.query(
      `SELECT id FROM productivity_metrics 
       WHERE user_id = $1 
       AND plant_id = $2 
       AND metric_date = $3`,
      [userId, plantId, today]
    )
    
    if (existing.length > 0) {
      // Update existing metric
      const { rows } = await db.query(
        `UPDATE productivity_metrics SET 
          health_status = $1,
          updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [status, existing[0].id]
      )
      return rows[0]
    }
    
    // Create new metric
    const { rows } = await db.query(
      `INSERT INTO productivity_metrics (user_id, plant_id, metric_date, health_status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, plantId, today, status]
    )
    
    return rows[0]
  } catch (error) {
    console.error('Error creating productivity metric:', error)
    return null
  }
}

/**
 * Update productivity metric when plant is harvested
 * @param {Object} db - Database query function
 * @param {number} userId - User ID
 * @param {number} plantId - Plant ID
 * @param {Object} harvestData - Harvest data (amount, revenue, etc.)
 */
export async function updateProductivityMetricOnHarvest(db, userId, plantId, harvestData) {
  try {
    const today = new Date().toISOString().split('T')[0]
    
    // Update or create metric with harvest status
    const { rows: existing } = await db.query(
      `SELECT id FROM productivity_metrics 
       WHERE user_id = $1 
       AND plant_id = $2 
       AND metric_date = $3`,
      [userId, plantId, today]
    )
    
    const notes = `Panen: ${harvestData.amount} kg, Revenue: ${harvestData.revenue}`
    
    if (existing.length > 0) {
      const { rows } = await db.query(
        `UPDATE productivity_metrics SET 
          health_status = 'harvested',
          notes = $1,
          updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [notes, existing[0].id]
      )
      return rows[0]
    } else {
      const { rows } = await db.query(
        `INSERT INTO productivity_metrics (user_id, plant_id, metric_date, health_status, notes)
         VALUES ($1, $2, $3, 'harvested', $4)
         RETURNING *`,
        [userId, plantId, today, notes]
      )
      return rows[0]
    }
  } catch (error) {
    console.error('Error updating productivity metric on harvest:', error)
    return null
  }
}

