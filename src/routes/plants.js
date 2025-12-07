import express from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { validatePlant } from '../middleware/validation.js'
import { getPaginationParams, getTotalCount, formatPaginationResponse } from '../utils/pagination.js'
import { createHarvestReminder, updateHarvestReminder, calculateEstimatedHarvestDate } from '../utils/reminderHelper.js'
import { createProductivityMetric } from '../utils/productivityHelper.js'
import { createNotificationFromTemplate } from '../utils/notificationHelper.js'

const router = express.Router()

// Helper: shape response with related names
function presentPlant(row) {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    planting_date: row.planting_date ? new Date(row.planting_date).toLocaleDateString('en-CA') : null,
    estimated_harvest_date: row.estimated_harvest_date ? new Date(row.estimated_harvest_date).toLocaleDateString('en-CA') : null,
    notes: row.notes,
    land: row.land_id
      ? { id: row.land_id, name: row.land_name, area_size: row.land_area_size, location: row.land_location }
      : null,
    plant_type: row.plant_type_id
      ? { id: row.plant_type_id, name: row.plant_type_name, watering_interval: row.watering_interval, icon: row.icon, harvest_days: row.harvest_days }
      : null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

// List plants for current user with relations
router.get('/', requireAuth, async (req, res) => {
  try {
    const { limit, offset } = getPaginationParams(req)
    const { rows } = await db.query(
      `SELECT p.*, 
              l.id as land_id, l.name as land_name, l.area_size as land_area_size, l.location as land_location,
              pt.id as plant_type_id, pt.name as plant_type_name, pt.watering_interval, pt.icon, pt.harvest_days,
              p.estimated_harvest_date
       FROM plants p
       LEFT JOIN lands l ON p.land_id = l.id
       LEFT JOIN plant_types pt ON p.plant_type_id = pt.id
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC NULLS LAST
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    )
    
    // Get total count for pagination
    const total = await getTotalCount(db, 'plants', 'user_id = $1', [req.user.id])
    
    res.json(formatPaginationResponse(
      rows.map(presentPlant),
      Math.floor(offset / limit) + 1,
      limit,
      total
    ))
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// Create plant
router.post('/', requireAuth, validatePlant, async (req, res) => {
  try {
    const { name, planting_date, status = 'active', notes, land_id = null, plant_type_id = null } = req.body
    if (!name || !planting_date) return res.status(400).json({ message: 'name and planting_date are required' })

    // If plant_type_id is not provided, try to map from notes (temporary fallback)
    let finalPlantTypeId = plant_type_id
    if (!finalPlantTypeId && notes) {
      // Simple fallback: try to match common plant names in notes
      const lower = notes.toLowerCase()
      const typeMap = {
        'padi': 1, 'jagung': 2, 'kedelai': 3, 'kacang tanah': 4, 'cabe': 5,
        'tomat': 6, 'terong': 7, 'kangkung': 8, 'bayam': 9, 'sawi': 10,
        'wortel': 11, 'bawang merah': 12, 'bawang putih': 13, 'kentang': 14,
        'ubi kayu': 15, 'ubi jalar': 16, 'kacang panjang': 17, 'labu': 18,
        'mentimun': 19, 'semangka': 20, 'melon': 21, 'stroberi': 22, 'cabai rawit': 23,
        'selada': 24, 'brokoli': 25, 'kubis': 26
      }
      for (const [name, id] of Object.entries(typeMap)) {
        if (lower.includes(name)) {
          finalPlantTypeId = id
          break
        }
      }
    }

    const { rows } = await db.query(
      `INSERT INTO plants (user_id, name, planting_date, status, notes, land_id, plant_type_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [req.user.id, name, planting_date, status, notes || null, land_id, finalPlantTypeId]
    )

    const created = rows[0]
    
    // Get plant type info for harvest days calculation
    let harvestDays = 60 // default
    let resolvedType = null
    if (finalPlantTypeId) {
      const { rows: plantTypeRows } = await db.query(
        'SELECT id, name, harvest_days FROM plant_types WHERE id = $1',
        [finalPlantTypeId]
      )
      if (plantTypeRows.length) {
        harvestDays = plantTypeRows[0].harvest_days || 60
        resolvedType = plantTypeRows[0]
      }
    }
    
    // Calculate estimated harvest date
    const estimatedHarvestDate = calculateEstimatedHarvestDate(
      new Date(planting_date),
      harvestDays
    )
    
    console.log('DEBUG: Plant creation - planting_date:', planting_date)
    console.log('DEBUG: Plant creation - harvestDays:', harvestDays)
    console.log('DEBUG: Plant creation - estimatedHarvestDate:', estimatedHarvestDate)
    console.log('DEBUG: Plant creation - estimatedHarvestDate formatted:', estimatedHarvestDate.toISOString().split('T')[0])
    
    // Get land name for reminder
    let landName = null
    if (land_id) {
      const { rows: landRows } = await db.query(
        'SELECT name FROM lands WHERE id = $1',
        [land_id]
      )
      landName = landRows[0]?.name || null
    }
    
    // Create automatic notifications for new plant (regardless of status)
    try {
      console.log('DEBUG: Creating notifications for plant:', name)
      console.log('DEBUG: User ID:', req.user.id)
      console.log('DEBUG: Plant ID:', created.id)
      console.log('DEBUG: Plant status:', status)
      console.log('DEBUG: Resolved type:', resolvedType)
      
      // 1. Welcome notification
      console.log('DEBUG: Creating welcome notification...')
      const welcomeNotif = await createNotificationFromTemplate(
        db, 
        req.user.id, 
        'plant_welcome', 
        { 
          plant_name: name,
          planting_date: planting_date,
          plant_type: resolvedType?.name || 'Tanaman'
        }, 
        created.id
      )
      console.log('DEBUG: Welcome notification created:', welcomeNotif?.id)
      
      // 2. First watering notification (if planted today)
      const today = new Date().toLocaleDateString('en-CA')
      const plantDate = new Date(planting_date).toLocaleDateString('en-CA')
      console.log('DEBUG: Today vs Plant date:', today, plantDate)
      
      if (today === plantDate) {
        console.log('DEBUG: Creating first watering notification...')
        const wateringNotif = await createNotificationFromTemplate(
          db, 
          req.user.id, 
          'first_watering', 
          { 
            plant_name: name,
            planting_date: planting_date
          }, 
          created.id
        )
        console.log('DEBUG: First watering notification created:', wateringNotif?.id)
      }
      
      console.log('✅ Plant notifications completed for:', name)
      
    } catch (notifError) {
      console.error('❌ Error creating plant notifications:', notifError)
      // Don't fail the request if notification creation fails
    }
    
    // Auto-create reminder for harvest (7 days before) - only for active plants
    if (status === 'active') {
      await createHarvestReminder(db, created.id, estimatedHarvestDate, name, landName)
      
      // Auto-create productivity metric for active plant
      await createProductivityMetric(db, req.user.id, created.id, 'active')
      
      // Create reminders for active plants
      try {
        console.log('DEBUG: Creating reminders for active plant:', name)
        
        // 3. Create watering reminder (every 2 days based on plant type)
        const wateringInterval = resolvedType?.watering_interval || 2
        const nextWatering = new Date(planting_date)
        nextWatering.setDate(nextWatering.getDate() + wateringInterval)
        
        await db.query(`
          INSERT INTO reminders (plant_id, type, title, message, due_date, status)
          VALUES ($1, 'watering', 'Jadwal Penyiraman', 'Saatnya menyiram ${name}', $2, 'pending')
          ON CONFLICT (plant_id, type, due_date) DO NOTHING
        `, [created.id, nextWatering.toISOString().split('T')[0]])
        
        // 4. Create fertilizing reminder (7 days after planting)
        const fertilizingDate = new Date(planting_date)
        fertilizingDate.setDate(fertilizingDate.getDate() + 7)
        
        await db.query(`
          INSERT INTO reminders (plant_id, type, title, message, due_date, status)
          VALUES ($1, 'fertilizing', 'Waktu Pemupukan', 'Saatnya memberikan pupuk untuk ${name}', $2, 'pending')
          ON CONFLICT (plant_id, type, due_date) DO NOTHING
        `, [created.id, fertilizingDate.toISOString().split('T')[0]])
        
        console.log(`✅ Created reminders for active plant: ${name}`)
        
      } catch (reminderError) {
        console.error('❌ Error creating reminders:', reminderError)
      }
    }
    
    // Update plants table with estimated_harvest_date
    console.log('DEBUG: Before update - estimatedHarvestDate:', estimatedHarvestDate.toISOString().split('T')[0])
    await db.query(
      'UPDATE plants SET estimated_harvest_date = $1 WHERE id = $2',
      [estimatedHarvestDate.toISOString().split('T')[0], created.id]
    )
    
    // Get updated plant data with estimated_harvest_date
    const { rows: updatedRows } = await db.query(
      `SELECT p.*, 
              l.id as land_id, l.name as land_name, l.area_size as land_area_size, l.location as land_location,
              pt.id as plant_type_id, pt.name as plant_type_name, pt.watering_interval,
              p.estimated_harvest_date
       FROM plants p
       LEFT JOIN lands l ON p.land_id = l.id
       LEFT JOIN plant_types pt ON p.plant_type_id = pt.id
       WHERE p.id = $1`,
      [created.id]
    )
    
    console.log('DEBUG: After update - updatedRows[0].estimated_harvest_date:', updatedRows[0].estimated_harvest_date)
    console.log('DEBUG: Response data:', JSON.stringify(presentPlant(updatedRows[0]), null, 2))
    
    res.status(201).json(presentPlant(updatedRows[0]))
  } catch (e) {
    console.error('ERROR: Plant creation failed:', e)
    console.error('ERROR: Stack trace:', e.stack)
    res.status(400).json({ message: e.message, error: e.toString() })
  }
})

// Update plant
router.put('/:id', requireAuth, validatePlant, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { name, planting_date, status, notes, land_id, plant_type_id } = req.body
    // Get current plant data for reminder update
    const { rows: currentRows } = await db.query(
      'SELECT planting_date, plant_type_id, land_id, name FROM plants WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    )
    if (!currentRows.length) return res.status(404).json({ message: 'Not found' })
    
    const current = currentRows[0]
    const finalPlantingDate = planting_date || current.planting_date
    const finalPlantTypeId = plant_type_id || current.plant_type_id
    const finalLandId = land_id !== undefined ? land_id : current.land_id
    const finalName = name || current.name
    
    const { rows } = await db.query(
      `UPDATE plants SET 
        name = COALESCE($2, name),
        planting_date = COALESCE($3::date, planting_date),
        status = COALESCE($4, status),
        notes = COALESCE($5, notes),
        land_id = COALESCE($6, land_id),
        plant_type_id = COALESCE($7, plant_type_id),
        updated_at = NOW()
       WHERE id=$1 AND user_id=$8
       RETURNING *`,
      [id, name ?? null, planting_date ?? null, status ?? null, notes ?? null, land_id ?? null, plant_type_id ?? null, req.user.id]
    )
    if (!rows.length) return res.status(404).json({ message: 'Not found' })
    
    const updated = rows[0]
    
    // Update reminder if planting_date or plant_type changed
    if (planting_date || plant_type_id) {
      let harvestDays = 60
      if (finalPlantTypeId) {
        const { rows: plantTypeRows } = await db.query(
          'SELECT harvest_days FROM plant_types WHERE id = $1',
          [finalPlantTypeId]
        )
        if (plantTypeRows.length && plantTypeRows[0].harvest_days) {
          harvestDays = plantTypeRows[0].harvest_days
        }
      }
      
      const estimatedHarvestDate = calculateEstimatedHarvestDate(
        new Date(finalPlantingDate),
        harvestDays
      )
      
      // Update estimated_harvest_date in plants table
      await db.query(
        'UPDATE plants SET estimated_harvest_date = $1 WHERE id = $2',
        [estimatedHarvestDate.toISOString().split('T')[0], id]
      )
      
      let landName = null
      if (finalLandId) {
        const { rows: landRows } = await db.query(
          'SELECT name FROM lands WHERE id = $1',
          [finalLandId]
        )
        landName = landRows[0]?.name || null
      }
      
      if (updated.status === 'active') {
        await updateHarvestReminder(db, id, estimatedHarvestDate, finalName, landName)
      }
    }
    
    // Update productivity metric if status changed
    if (status && status !== current.status) {
      await createProductivityMetric(db, req.user.id, id, status)
    }
    
    // Get updated plant data with estimated_harvest_date
    const { rows: updatedRows } = await db.query(
      `SELECT p.*, 
              l.id as land_id, l.name as land_name, l.area_size as land_area_size, l.location as land_location,
              pt.id as plant_type_id, pt.name as plant_type_name, pt.watering_interval,
              p.estimated_harvest_date
       FROM plants p
       LEFT JOIN lands l ON p.land_id = l.id
       LEFT JOIN plant_types pt ON p.plant_type_id = pt.id
       WHERE p.id = $1`,
      [id]
    )
    
    res.json(presentPlant(updatedRows[0]))
  } catch (e) {
    res.status(400).json({ message: e.message })
  }
})

// Delete plant
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { rowCount } = await db.query('DELETE FROM plants WHERE id=$1 AND user_id=$2', [id, req.user.id])
    if (!rowCount) return res.status(404).json({ message: 'Not found' })
    res.json({ success: true })
  } catch (e) {
    res.status(400).json({ message: e.message })
  }
})

export default router
