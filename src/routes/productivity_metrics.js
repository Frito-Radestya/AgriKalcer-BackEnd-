import express from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

// Get all productivity metrics for current user
router.get('/', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT pm.*, 
              p.id as plant_id, p.name as plant_name, p.status,
              l.name as land_name
       FROM productivity_metrics pm
       LEFT JOIN plants p ON pm.plant_id = p.id
       LEFT JOIN lands l ON p.land_id = l.id
       WHERE pm.user_id = $1
       ORDER BY pm.metric_date DESC, pm.created_at DESC`,
      [req.user.id]
    )
    
    const metrics = rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      plantId: row.plant_id,
      plantName: row.plant_name,
      landName: row.land_name,
      plantStatus: row.status,
      metricDate: row.metric_date,
      height: row.height ? parseFloat(row.height) : null,
      healthStatus: row.health_status,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))
    
    res.json(metrics)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// Get metrics by plant ID
router.get('/plant/:plantId', requireAuth, async (req, res) => {
  try {
    const plantId = Number(req.params.plantId)
    
    // Verify plant belongs to user
    const { rows: plantCheck } = await db.query(
      'SELECT id FROM plants WHERE id = $1 AND user_id = $2',
      [plantId, req.user.id]
    )
    
    if (!plantCheck.length) {
      return res.status(404).json({ message: 'Plant not found' })
    }
    
    const { rows } = await db.query(
      `SELECT pm.*, 
              p.id as plant_id, p.name as plant_name, p.status,
              l.name as land_name
       FROM productivity_metrics pm
       LEFT JOIN plants p ON pm.plant_id = p.id
       LEFT JOIN lands l ON p.land_id = l.id
       WHERE pm.plant_id = $1 AND pm.user_id = $2
       ORDER BY pm.metric_date DESC`,
      [plantId, req.user.id]
    )
    
    const metrics = rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      plantId: row.plant_id,
      plantName: row.plant_name,
      landName: row.land_name,
      plantStatus: row.status,
      metricDate: row.metric_date,
      height: row.height ? parseFloat(row.height) : null,
      healthStatus: row.health_status,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))
    
    res.json(metrics)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// Update productivity metric
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { height, healthStatus, notes } = req.body
    
    // Verify metric belongs to user
    const { rows: existing } = await db.query(
      'SELECT id FROM productivity_metrics WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    )
    
    if (!existing.length) {
      return res.status(404).json({ message: 'Not found' })
    }
    
    const { rows } = await db.query(
      `UPDATE productivity_metrics SET 
        height = COALESCE($2, height),
        health_status = COALESCE($3, health_status),
        notes = COALESCE($4, notes),
        updated_at = NOW()
       WHERE id = $1 AND user_id = $5
       RETURNING *`,
      [id, height ?? null, healthStatus ?? null, notes ?? null, req.user.id]
    )
    
    const updated = rows[0]
    res.json({
      id: updated.id,
      height: updated.height ? parseFloat(updated.height) : null,
      healthStatus: updated.health_status,
      notes: updated.notes,
      updatedAt: updated.updated_at,
    })
  } catch (e) {
    res.status(400).json({ message: e.message })
  }
})

// Delete productivity metric
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { rowCount } = await db.query(
      'DELETE FROM productivity_metrics WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    )
    
    if (!rowCount) return res.status(404).json({ message: 'Not found' })
    res.json({ success: true })
  } catch (e) {
    res.status(400).json({ message: e.message })
  }
})

export default router

