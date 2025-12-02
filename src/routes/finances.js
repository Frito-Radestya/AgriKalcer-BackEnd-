import express from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { validateFinance } from '../middleware/validation.js'
import { getPaginationParams, getTotalCount, formatPaginationResponse } from '../utils/pagination.js'

const router = express.Router()

// Get all finances for current user
router.get('/', requireAuth, async (req, res) => {
  try {
    const { limit, offset } = getPaginationParams(req)
    const { rows } = await db.query(
      `SELECT f.*, 
              p.id as plant_id, p.name as plant_name
       FROM finances f
       LEFT JOIN plants p ON f.plant_id = p.id
       WHERE f.user_id = $1
       ORDER BY f.date DESC, f.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    )
    const finances = rows.map(row => ({
      id: row.id,
      type: row.type,
      category: row.category,
      amount: parseFloat(row.amount),
      description: row.description,
      date: row.date,
      plantId: row.plant_id ? row.plant_id : null,
      plantName: row.plant_name,
      createdAt: row.created_at,
    }))
    
    // Get total count for pagination
    const total = await getTotalCount(db, 'finances', 'user_id = $1', [req.user.id])
    
    res.json(formatPaginationResponse(
      finances,
      Math.floor(offset / limit) + 1,
      limit,
      total
    ))
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// Create finance
router.post('/', requireAuth, validateFinance, async (req, res) => {
  try {
    const { type, category, amount, description, date, plantId } = req.body
    if (!type || !amount || !date) {
      return res.status(400).json({ message: 'type, amount, and date are required' })
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
      `INSERT INTO finances (user_id, type, category, amount, description, date, plant_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.user.id, type, category || null, amount, description || null, date, plantId || null]
    )

    const created = rows[0]
    res.status(201).json({
      id: created.id,
      type: created.type,
      category: created.category,
      amount: parseFloat(created.amount),
      description: created.description,
      date: created.date,
      plantId: created.plant_id,
      createdAt: created.created_at,
    })
  } catch (e) {
    res.status(400).json({ message: e.message })
  }
})

// Update finance
router.put('/:id', requireAuth, validateFinance, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { type, category, amount, description, date, plantId } = req.body

    // Verify finance belongs to user
    const { rows: existing } = await db.query(
      'SELECT id FROM finances WHERE id=$1 AND user_id=$2',
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
      `UPDATE finances SET 
        type = COALESCE($2, type),
        category = COALESCE($3, category),
        amount = COALESCE($4, amount),
        description = COALESCE($5, description),
        date = COALESCE($6::date, date),
        plant_id = COALESCE($7, plant_id),
        updated_at = NOW()
       WHERE id=$1 AND user_id=$8
       RETURNING *`,
      [id, type ?? null, category ?? null, amount ?? null, description ?? null, date ?? null, plantId ?? null, req.user.id]
    )

    const updated = rows[0]
    res.json({
      id: updated.id,
      type: updated.type,
      category: updated.category,
      amount: parseFloat(updated.amount),
      description: updated.description,
      date: updated.date,
      plantId: updated.plant_id,
      createdAt: updated.created_at,
    })
  } catch (e) {
    res.status(400).json({ message: e.message })
  }
})

// Delete finance
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { rowCount } = await db.query(
      'DELETE FROM finances WHERE id=$1 AND user_id=$2',
      [id, req.user.id]
    )
    if (!rowCount) return res.status(404).json({ message: 'Not found' })
    res.json({ success: true })
  } catch (e) {
    res.status(400).json({ message: e.message })
  }
})

export default router

