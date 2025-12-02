import express from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

// Get all maintenance logs for current user
router.get('/', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT ml.*, 
              p.id as plant_id, p.name as plant_name,
              l.name as land_name
       FROM maintenance_logs ml
       LEFT JOIN plants p ON ml.plant_id = p.id
       LEFT JOIN lands l ON p.land_id = l.id
       WHERE ml.user_id = $1
       ORDER BY ml.performed_at DESC, ml.created_at DESC`,
      [req.user.id]
    )
    
    const logs = rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      plantId: row.plant_id,
      plantName: row.plant_name,
      landName: row.land_name,
      reminderId: row.reminder_id,
      activityType: row.activity_type,
      description: row.description,
      notes: row.notes,
      performedAt: row.performed_at,
      createdAt: row.created_at,
    }))
    
    res.json(logs)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// Get maintenance log by ID
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { rows } = await db.query(
      `SELECT ml.*, 
              p.id as plant_id, p.name as plant_name,
              l.name as land_name
       FROM maintenance_logs ml
       LEFT JOIN plants p ON ml.plant_id = p.id
       LEFT JOIN lands l ON p.land_id = l.id
       WHERE ml.id = $1 AND ml.user_id = $2`,
      [id, req.user.id]
    )
    
    if (!rows.length) {
      return res.status(404).json({ message: 'Not found' })
    }
    
    const log = rows[0]
    res.json({
      id: log.id,
      userId: log.user_id,
      plantId: log.plant_id,
      plantName: log.plant_name,
      landName: log.land_name,
      reminderId: log.reminder_id,
      activityType: log.activity_type,
      description: log.description,
      notes: log.notes,
      performedAt: log.performed_at,
      createdAt: log.created_at,
    })
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// Delete maintenance log
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { rowCount } = await db.query(
      'DELETE FROM maintenance_logs WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    )
    
    if (!rowCount) return res.status(404).json({ message: 'Not found' })
    res.json({ success: true })
  } catch (e) {
    res.status(400).json({ message: e.message })
  }
})

export default router

