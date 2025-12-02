import express from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

// Get all message templates (admin only, or public for reading)
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM message_templates ORDER BY template_key ASC'
    )
    res.json(rows)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// Get template by key
router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params
    const { rows } = await db.query(
      'SELECT * FROM message_templates WHERE template_key = $1',
      [key]
    )
    if (!rows.length) {
      return res.status(404).json({ message: 'Template not found' })
    }
    res.json(rows[0])
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// Update template (admin only - bisa ditambahkan middleware admin nanti)
router.put('/:key', requireAuth, async (req, res) => {
  try {
    const { key } = req.params
    const { title_template, message_template, description, variables } = req.body
    
    const { rows } = await db.query(
      `UPDATE message_templates SET 
        title_template = COALESCE($2, title_template),
        message_template = COALESCE($3, message_template),
        description = COALESCE($4, description),
        variables = COALESCE($5::jsonb, variables),
        updated_at = NOW()
       WHERE template_key = $1
       RETURNING *`,
      [key, title_template ?? null, message_template ?? null, description ?? null, variables ? JSON.stringify(variables) : null]
    )
    
    if (!rows.length) {
      return res.status(404).json({ message: 'Template not found' })
    }
    
    res.json(rows[0])
  } catch (e) {
    res.status(400).json({ message: e.message })
  }
})

export default router

