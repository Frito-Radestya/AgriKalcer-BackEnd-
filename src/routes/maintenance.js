import express from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { validateMaintenance } from '../middleware/validation.js'
import { createMaintenanceReminderNotification } from '../utils/notificationHelper.js'
import { createWateringReminder } from '../utils/wateringReminder.js'

const router = express.Router()

// Get all maintenance for current user
router.get('/', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT m.*, 
              p.id as plant_id, p.name as plant_name
       FROM maintenance m
       LEFT JOIN plants p ON m.plant_id = p.id
       WHERE m.user_id = $1
       ORDER BY m.date DESC, m.created_at DESC`,
      [req.user.id]
    )
    const maintenance = rows.map(row => ({
      id: row.id,
      plantId: row.plant_id,
      plantName: row.plant_name,
      type: row.type,
      date: row.date,
      notes: row.notes,
      cost: parseFloat(row.cost || 0),
      createdAt: row.created_at,
    }))
    res.json(maintenance)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// Create maintenance
router.post('/', requireAuth, validateMaintenance, async (req, res) => {
  try {
    const { plantId, type, date, notes, cost } = req.body
    if (!plantId || !type || !date) {
      return res.status(400).json({ message: 'plantId, type, and date are required' })
    }

    // Verify plant belongs to user and get plant info
    const { rows: plantCheck } = await db.query(
      `SELECT p.id, p.name, l.name as land_name, pt.watering_interval
       FROM plants p
       LEFT JOIN lands l ON p.land_id = l.id
       LEFT JOIN plant_types pt ON p.plant_type_id = pt.id
       WHERE p.id=$1 AND p.user_id=$2`,
      [plantId, req.user.id]
    )
    if (!plantCheck.length) {
      return res.status(404).json({ message: 'Plant not found' })
    }
    
    const plantInfo = plantCheck[0]

    const { rows } = await db.query(
      `INSERT INTO maintenance (user_id, plant_id, type, date, notes, cost)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.user.id, plantId, type, date, notes || null, cost || 0]
    )

    const created = rows[0]
    
    // Auto-create maintenance log
    try {
      const description = `Perawatan ${type} untuk tanaman`
      await db.query(
        `INSERT INTO maintenance_logs (user_id, plant_id, activity_type, description, notes, performed_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [req.user.id, plantId, type, description, notes || null, date]
      )
    } catch (logError) {
      console.error('Error creating maintenance log:', logError)
      // Don't fail the request if log creation fails
    }
    
    // Create notification from message template based on maintenance type
    try {
      const maintenanceTypeMap = {
        'penyiraman': 'watering',
        'watering': 'watering',
        'pemupukan': 'fertilizing',
        'fertilizing': 'fertilizing',
        'penyiangan': 'weeding',
        'weeding': 'weeding',
        'pestisida': 'pesticide',
        'pesticide': 'pesticide'
      }
      
      const mappedType = maintenanceTypeMap[type.toLowerCase()] || type.toLowerCase()
      
      await createMaintenanceReminderNotification(db, req.user.id, plantId, mappedType, {
        name: plantInfo.name,
        landName: plantInfo.land_name,
        wateringDescription: plantInfo.watering_interval ? `setiap ${plantInfo.watering_interval} hari` : 'secara berkala',
        activityDescription: type,
        day: Math.floor((new Date() - new Date(plantInfo.planting_date || new Date())) / (1000 * 60 * 60 * 24))
      })

      // Create automatic watering reminder for next watering
      if (mappedType === 'watering' && plantInfo.watering_interval) {
        await createWateringReminder(
          req.user.id,
          plantId,
          new Date(date),
          plantInfo.watering_interval,
          {
            name: plantInfo.name,
            landName: plantInfo.land_name
          }
        )
      }
    } catch (notifError) {
      console.error('Error creating maintenance notification:', notifError)
      // Don't fail the request if notification creation fails
    }
    
    res.status(201).json({
      id: created.id,
      plantId: created.plant_id,
      type: created.type,
      date: created.date,
      notes: created.notes,
      cost: parseFloat(created.cost || 0),
      createdAt: created.created_at,
    })
  } catch (e) {
    res.status(400).json({ message: e.message })
  }
})

// Update maintenance
router.put('/:id', requireAuth, validateMaintenance, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { plantId, type, date, notes, cost } = req.body

    // Verify maintenance belongs to user
    const { rows: existing } = await db.query(
      'SELECT id FROM maintenance WHERE id=$1 AND user_id=$2',
      [id, req.user.id]
    )
    if (!existing.length) {
      return res.status(404).json({ message: 'Not found' })
    }

    // Verify plant belongs to user if plantId provided
    if (plantId) {
      const { rows: plantCheck } = await db.query(
        'SELECT id FROM plants WHERE id=$1 AND user_id=$2',
        [plantId, req.user.id]
      )
      if (!plantCheck.length) {
        return res.status(404).json({ message: 'Plant not found' })
      }
    }

    const { rows } = await db.query(
      `UPDATE maintenance SET 
        plant_id = COALESCE($2, plant_id),
        type = COALESCE($3, type),
        date = COALESCE($4::date, date),
        notes = COALESCE($5, notes),
        cost = COALESCE($6, cost),
        updated_at = NOW()
       WHERE id=$1 AND user_id=$7
       RETURNING *`,
      [id, plantId ?? null, type ?? null, date ?? null, notes ?? null, cost ?? null, req.user.id]
    )

    const updated = rows[0]
    res.json({
      id: updated.id,
      plantId: updated.plant_id,
      type: updated.type,
      date: updated.date,
      notes: updated.notes,
      cost: parseFloat(updated.cost || 0),
      createdAt: updated.created_at,
    })
  } catch (e) {
    res.status(400).json({ message: e.message })
  }
})

// Delete maintenance
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { rowCount } = await db.query(
      'DELETE FROM maintenance WHERE id=$1 AND user_id=$2',
      [id, req.user.id]
    )
    if (!rowCount) return res.status(404).json({ message: 'Not found' })
    res.json({ success: true })
  } catch (e) {
    res.status(400).json({ message: e.message })
  }
})

export default router

