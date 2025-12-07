import express from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { checkAndCreateAllWateringReminders, generateNotificationsFromDueReminders } from '../utils/wateringReminder.js'

const router = express.Router()

// Get all reminders for current user (upcoming harvests within 7 days)
router.get('/', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT r.*, 
              p.id as plant_id, p.name as plant_name, p.planting_date, p.user_id as plant_user_id,
              l.name as land_name
       FROM reminders r
       LEFT JOIN plants p ON r.plant_id = p.id
       LEFT JOIN lands l ON p.land_id = l.id
       WHERE p.user_id = $1
       AND r.status = 'pending'
       AND r.due_date >= NOW()
       AND r.due_date <= NOW() + INTERVAL '7 days'
       ORDER BY r.due_date ASC`,
      [req.user.id]
    )
    
    const reminders = rows.map(row => ({
      id: row.id,
      plantId: row.plant_id,
      plantName: row.plant_name,
      landName: row.land_name,
      type: row.type,
      title: row.title,
      message: row.message,
      dueDate: row.due_date,
      status: row.status,
      completedAt: row.completed_at,
      createdAt: row.created_at,
    }))
    
    res.json(reminders)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// Get reminder by ID
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { rows } = await db.query(
      `SELECT r.*, 
              p.id as plant_id, p.name as plant_name, p.user_id as plant_user_id,
              l.name as land_name
       FROM reminders r
       LEFT JOIN plants p ON r.plant_id = p.id
       LEFT JOIN lands l ON p.land_id = l.id
       WHERE r.id = $1 
       AND p.user_id = $2`,
      [id, req.user.id]
    )
    
    if (!rows.length) {
      return res.status(404).json({ message: 'Not found' })
    }
    
    const reminder = rows[0]
    res.json({
      id: reminder.id,
      plantId: reminder.plant_id,
      plantName: reminder.plant_name,
      landName: reminder.land_name,
      type: reminder.type,
      title: reminder.title,
      message: reminder.message,
      dueDate: reminder.due_date,
      status: reminder.status,
      completedAt: reminder.completed_at,
      createdAt: reminder.created_at,
    })
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// Mark reminder as completed
router.put('/:id/complete', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id)
    
    // Verify reminder belongs to user's plant
    const { rows: existing } = await db.query(
      `SELECT r.id FROM reminders r
       JOIN plants p ON r.plant_id = p.id
       WHERE r.id = $1 
       AND p.user_id = $2`,
      [id, req.user.id]
    )
    
    if (!existing.length) {
      return res.status(404).json({ message: 'Not found' })
    }
    
    const { rows } = await db.query(
      `UPDATE reminders SET 
        status = 'completed',
        completed_at = NOW(),
        updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id]
    )
    
    res.json({
      id: rows[0].id,
      status: rows[0].status,
      completedAt: rows[0].completed_at,
    })
  } catch (e) {
    res.status(400).json({ message: e.message })
  }
})

// Delete reminder
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id)
    
    const { rowCount } = await db.query(
      `DELETE FROM reminders 
       USING plants p
       WHERE reminders.id = $1 
       AND reminders.plant_id = p.id
       AND p.user_id = $2`,
      [id, req.user.id]
    )
    
    if (!rowCount) return res.status(404).json({ message: 'Not found' })
    res.json({ success: true })
  } catch (e) {
    res.status(400).json({ message: e.message })
  }
})

// Test endpoint - check and create watering reminders (for development/testing)
router.post('/check-watering', requireAuth, async (req, res) => {
  try {
    await checkAndCreateAllWateringReminders()
    await generateNotificationsFromDueReminders()
    res.json({ message: 'Watering reminders checked and notifications generated' })
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// Test endpoint - run daily notification scheduler (for development/testing)
router.post('/run-scheduler', requireAuth, async (req, res) => {
  try {
    const { runDailyNotificationScheduler } = require('../utils/notificationScheduler.js')
    await runDailyNotificationScheduler()
    res.json({ message: 'Daily notification scheduler completed successfully' })
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

export default router

