import express from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { validateLand } from '../middleware/validation.js'

const router = express.Router()

// Get all lands for current user
router.get('/', requireAuth, async (req, res) => {
  const { rows } = await db.query(
    'SELECT id, user_id, name, location, area_size, latitude, longitude, notes, created_at, updated_at FROM lands WHERE user_id=$1 ORDER BY created_at DESC NULLS LAST',
    [req.user.id]
  )
  res.json(rows)
})

// Create land
router.post('/', requireAuth, validateLand, async (req, res) => {
  try {
    const { name, location, area_size, latitude, longitude, notes } = req.body
    const { rows } = await db.query(
      `INSERT INTO lands (user_id, name, location, area_size, latitude, longitude, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [req.user.id, name || null, location || null, area_size || null, latitude || null, longitude || null, notes || null]
    )
    res.status(201).json(rows[0])
  } catch (e) {
    res.status(400).json({ message: e.message })
  }
})

// Update land
router.put('/:id', requireAuth, validateLand, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { name, location, area_size, latitude, longitude, notes } = req.body
    const { rows } = await db.query(
      'UPDATE lands SET name=COALESCE($2,name), location=COALESCE($3,location), area_size=COALESCE($4,area_size), latitude=COALESCE($5,latitude), longitude=COALESCE($6,longitude), notes=COALESCE($8,notes), updated_at=NOW() WHERE id=$1 AND user_id=$7 RETURNING id, user_id, name, location, area_size, latitude, longitude, notes, created_at, updated_at',
      [id, name ?? null, location ?? null, area_size ?? null, latitude ?? null, longitude ?? null, req.user.id, notes ?? null]
    )
    if (!rows.length) return res.status(404).json({ message: 'Not found' })
    res.json(rows[0])
  } catch (e) {
    res.status(400).json({ message: e.message })
  }
})

// Delete land
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { rowCount } = await db.query('DELETE FROM lands WHERE id=$1 AND user_id=$2', [id, req.user.id])
    if (!rowCount) return res.status(404).json({ message: 'Not found' })
    res.json({ success: true })
  } catch (e) {
    res.status(400).json({ message: e.message })
  }
})

export default router
