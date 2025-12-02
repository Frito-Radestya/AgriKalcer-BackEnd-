import express from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

// Get all plant types
router.get('/', requireAuth, async (req, res) => {
  try {
    const { name } = req.query
    let sql = 'SELECT id, name, watering_interval, harvest_days, icon FROM plant_types ORDER BY name'
    let params = []
    if (name) {
      sql = 'SELECT id, name, watering_interval, harvest_days, icon FROM plant_types WHERE name = $1 ORDER BY name'
      params = [name]
    }
    const { rows } = await db.query(sql, params)
    res.json(rows)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

export default router
