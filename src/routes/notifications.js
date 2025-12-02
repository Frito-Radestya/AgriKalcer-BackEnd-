import express from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { createAISuggestionNotification, generateNotificationsFromReminders } from '../utils/notificationHelper.js'

const router = express.Router()

// Get all notifications for current user (combines template-based and AI suggestions)
router.get('/', requireAuth, async (req, res) => {
  try {
    // 1) Generate notifications from reminders + message_templates
    await generateNotificationsFromReminders(db, req.user.id)

    // 2) Optionally generate AI suggestions if feature flag is enabled
    const enableAI = (process.env.ENABLE_AI_SUGGESTIONS || 'false').toLowerCase() === 'true'
    if (enableAI) {
      await createAISuggestionNotification(db, req.user.id, {})
    }
    
    const { rows } = await db.query(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY 
         CASE 
           WHEN related_entity_type = 'ai_suggestion' THEN 0
           ELSE 1
         END,
         created_at DESC`,
      [req.user.id]
    )
    const notifications = rows.map(row => ({
      id: row.id,
      title: row.title,
      message: row.message,
      type: row.type,
      read: row.is_read || row.read || false, // Support both is_read and read
      plantId: row.related_entity_type === 'plant' ? row.related_entity_id : (row.plant_id || null),
      source: row.related_entity_type === 'ai_suggestion' ? 'ai' : (row.related_entity_type === 'reminder' ? 'reminder' : 'template'),
      createdAt: row.created_at,
      readAt: row.read_at,
    }))
    res.json(notifications)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// Create notification
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, message, type, plantId } = req.body
    if (!title || !message) {
      return res.status(400).json({ message: 'title and message are required' })
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

    // Check table structure - support both old and new schema
    const { rows: checkCols } = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'notifications' 
      AND column_name IN ('is_read', 'related_entity_type', 'related_entity_id')
    `)
    
    const hasNewSchema = checkCols.some(col => col.column_name === 'is_read')
    
    let result
    if (hasNewSchema) {
      // Use new schema with related_entity_type
      result = await db.query(
        `INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id, is_read)
         VALUES ($1, $2, $3, $4, $5, $6, false)
         RETURNING *`,
        [req.user.id, title, message, type || 'info', plantId ? 'plant' : null, plantId || null]
      )
    } else {
      // Use old schema with plant_id and read
      result = await db.query(
        `INSERT INTO notifications (user_id, title, message, type, plant_id, read)
         VALUES ($1, $2, $3, $4, $5, false)
         RETURNING *`,
        [req.user.id, title, message, type || 'info', plantId || null]
      )
    }

    const created = result.rows[0]
    res.status(201).json({
      id: created.id,
      title: created.title,
      message: created.message,
      type: created.type,
      read: created.is_read !== undefined ? created.is_read : created.read,
      plantId: created.related_entity_type === 'plant' ? created.related_entity_id : (created.plant_id || null),
      createdAt: created.created_at,
    })
  } catch (e) {
    res.status(400).json({ message: e.message })
  }
})

// Update notification (mark as read)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { read } = req.body

    // Check table structure
    const { rows: checkCols } = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'notifications' 
      AND column_name IN ('is_read', 'read_at')
    `)
    
    const hasNewSchema = checkCols.some(col => col.column_name === 'is_read')
    
    let result
    if (hasNewSchema) {
      // Use new schema
      result = await db.query(
        `UPDATE notifications SET 
          is_read = COALESCE($2, is_read),
          read_at = CASE WHEN $2 = true THEN COALESCE(read_at, NOW()) ELSE read_at END,
          updated_at = CURRENT_TIMESTAMP
         WHERE id=$1 AND user_id=$3
         RETURNING *`,
        [id, read ?? null, req.user.id]
      )
    } else {
      // Use old schema
      result = await db.query(
        `UPDATE notifications SET 
          read = COALESCE($2, read),
          read_at = CASE WHEN $2 = true THEN COALESCE(read_at, NOW()) ELSE read_at END
         WHERE id=$1 AND user_id=$3
         RETURNING *`,
        [id, read ?? null, req.user.id]
      )
    }
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Notification not found' })
    }
    
    res.json(result.rows[0])
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// Delete notification
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { rowCount } = await db.query(
      'DELETE FROM notifications WHERE id=$1 AND user_id=$2',
      [id, req.user.id]
    )
    if (!rowCount) return res.status(404).json({ message: 'Not found' })
    res.json({ success: true })
  } catch (e) {
    res.status(400).json({ message: e.message })
  }
})

// Bulk update notifications (mark all as read)
router.put('/mark-all-read', requireAuth, async (req, res) => {
  try {
    console.log('DEBUG: Bulk mark all as read called')
    console.log('DEBUG: req.user:', req.user)
    console.log('DEBUG: req.user.id:', req.user.id)
    console.log('DEBUG: typeof req.user.id:', typeof req.user.id)
    console.log('DEBUG: isNaN(req.user.id):', isNaN(req.user.id))
    
    const userId = req.user.id
    if (!userId || isNaN(userId) || userId === 'NaN') {
      console.error('DEBUG: Invalid user ID:', userId)
      return res.status(400).json({ message: 'Invalid user ID' })
    }
    
    console.log('DEBUG: Using user ID for query:', userId)
    
    // Check table structure
    const { rows: checkCols } = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'notifications' 
      AND column_name IN ('is_read', 'read')
    `)
    
    const hasNewSchema = checkCols.some(col => col.column_name === 'is_read')
    console.log('DEBUG: Schema type:', hasNewSchema ? 'new (is_read)' : 'old (read)')
    
    let result
    if (hasNewSchema) {
      // Use new schema
      console.log('DEBUG: Executing new schema query with user ID:', userId)
      result = await db.query(
        `UPDATE notifications SET 
          is_read = true,
          read_at = COALESCE(read_at, NOW()),
          updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $1 AND is_read = false
         RETURNING *`,
        [userId]
      )
    } else {
      // Use old schema
      console.log('DEBUG: Executing old schema query with user ID:', userId)
      result = await db.query(
        `UPDATE notifications SET 
          read = true,
          read_at = COALESCE(read_at, NOW())
         WHERE user_id = $1 AND read = false
         RETURNING *`,
        [userId]
      )
    }
    
    console.log('DEBUG: Updated notifications count:', result.rows.length)
    
    res.json({ 
      message: 'All notifications marked as read',
      updated: result.rows.length,
      notifications: result.rows
    })
  } catch (e) {
    console.error('DEBUG: Bulk update error:', e)
    console.error('DEBUG: Error stack:', e.stack)
    res.status(500).json({ message: e.message })
  }
})

// Generate AI suggestions manually (endpoint untuk trigger manual)
router.post('/generate-ai-suggestions', requireAuth, async (req, res) => {
  try {
    const count = await createAISuggestionNotification(db, req.user.id, {})
    res.json({ 
      success: true, 
      message: `Generated ${count} AI suggestion notifications`,
      count 
    })
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

export default router

