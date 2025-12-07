import express from 'express'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { validateHarvest } from '../middleware/validation.js'
import { updateProductivityMetricOnHarvest } from '../utils/productivityHelper.js'
import { createNotificationFromTemplate } from '../utils/notificationHelper.js'

const router = express.Router()

// Get all harvests for current user
router.get('/', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT h.id, h.plant_id, h.date, h.amount, 
              COALESCE(h.unit, 'kg') as unit, 
              h.price_per_kg, h.revenue, 
              COALESCE(h.quality, 'good') as quality, 
              h.notes, h.created_at,
              p.name as plant_name, p.plant_type_id,
              l.area_size as land_area, l.name as land_name
       FROM harvests h
       LEFT JOIN plants p ON h.plant_id = p.id
       LEFT JOIN lands l ON p.land_id = l.id
       WHERE h.user_id = $1
       ORDER BY h.date DESC, h.created_at DESC`,
      [req.user.id]
    )
    const harvests = rows.map(row => ({
      id: row.id,
      plantId: row.plant_id,
      plantName: row.plant_name,
      date: row.date,
      amount: parseFloat(row.amount),
      unit: row.unit || 'kg',
      pricePerKg: parseFloat(row.price_per_kg),
      revenue: parseFloat(row.revenue),
      quality: row.quality || 'good',
      notes: row.notes,
      createdAt: row.created_at,
    }))
    res.json(harvests)
  } catch (e) {
    console.error('Error in GET /harvests:', e)
    res.status(500).json({ message: e.message })
  }
})

// Create harvest
router.post('/', requireAuth, validateHarvest, async (req, res) => {
  try {
    const { plantId, date, amount, unit, pricePerKg, quality, notes } = req.body
    if (!plantId || !date || !amount || !pricePerKg) {
      return res.status(400).json({ message: 'plantId, date, amount, and pricePerKg are required' })
    }

    // Verify plant belongs to user dan ambil nama tanaman untuk notifikasi
    const { rows: plantCheck } = await db.query(
      'SELECT id, name FROM plants WHERE id=$1 AND user_id=$2',
      [plantId, req.user.id]
    )
    if (!plantCheck.length) {
      return res.status(404).json({ message: 'Plant not found' })
    }

    // Convert amount to kg for revenue calculation
    let amountInKg = parseFloat(amount)
    if (unit === 'ton') {
      amountInKg = amountInKg * 1000
    } else if (unit === 'kuintal') {
      amountInKg = amountInKg * 100
    }
    
    const revenue = amountInKg * parseFloat(pricePerKg)

    const { rows } = await db.query(
      `INSERT INTO harvests (user_id, plant_id, date, amount, unit, price_per_kg, revenue, quality, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [req.user.id, plantId, date, amount, unit || 'kg', pricePerKg, revenue, quality || 'good', notes || null]
    )

    // Update plant status to harvested
    await db.query(
      'UPDATE plants SET status=$1, updated_at=NOW() WHERE id=$2 AND user_id=$3',
      ['harvested', plantId, req.user.id]
    )

    const created = rows[0]
    
    // Auto-update productivity metric on harvest
    try {
      await updateProductivityMetricOnHarvest(db, req.user.id, plantId, {
        amount: parseFloat(amount),
        revenue: parseFloat(revenue),
      })
    } catch (metricError) {
      console.error('Error updating productivity metric:', metricError)
      // Don't fail the request if metric update fails
    }
    
    // Buat notifikasi "selamat panen" berbasis template
    try {
      const plantName = plantCheck[0]?.name || 'Tanaman'
      await createNotificationFromTemplate(
        db,
        req.user.id,
        'harvest_congrats',
        {
          plant_name: plantName,
          harvest_amount: `${amountInKg} kg`,
          harvest_unit: unit || 'kg',
          harvest_amount_original: `${amount} ${unit || 'kg'}`,
          harvest_revenue: revenue.toFixed(0),
          harvest_date: date,
        },
        plantId,
        'harvest',
        created.id,
      )
    } catch (notifError) {
      console.error('Error creating harvest congratulations notification:', notifError)
      // Jangan gagal hanya karena notifikasi error
    }
    
    res.status(201).json({
      id: created.id,
      plantId: created.plant_id,
      date: created.date,
      amount: parseFloat(created.amount),
      unit: created.unit,
      pricePerKg: parseFloat(created.price_per_kg),
      revenue: parseFloat(created.revenue),
      quality: created.quality,
      notes: created.notes,
      createdAt: created.created_at,
    })
  } catch (e) {
    res.status(400).json({ message: e.message })
  }
})

// Update harvest
router.put('/:id', requireAuth, validateHarvest, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { plantId, date, amount, pricePerKg, quality, notes } = req.body

    // Verify harvest belongs to user and get current values
    const { rows: existing } = await db.query(
      'SELECT id, amount, price_per_kg FROM harvests WHERE id=$1 AND user_id=$2',
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

    // Get current values (including unit) to calculate revenue correctly
    const { rows: currentRows } = await db.query(
      'SELECT amount, price_per_kg, unit FROM harvests WHERE id=$1 AND user_id=$2',
      [id, req.user.id]
    )
    if (!currentRows.length) {
      return res.status(404).json({ message: 'Not found' })
    }
    
    const current = currentRows[0]
    const finalAmount = amount ? parseFloat(amount) : parseFloat(current.amount)
    const finalPricePerKg = pricePerKg ? parseFloat(pricePerKg) : parseFloat(current.price_per_kg)

    // Gunakan unit dari request jika ada, jika tidak pakai unit existing, default 'kg'
    const unitFromRequest = req.body.unit
    const effectiveUnit = unitFromRequest || current.unit || 'kg'

    // Konversi ke kg dulu baru hitung revenue, sama seperti route POST
    let amountInKg = finalAmount
    if (effectiveUnit === 'ton') {
      amountInKg = amountInKg * 1000
    } else if (effectiveUnit === 'kuintal') {
      amountInKg = amountInKg * 100
    }

    const calculatedRevenue = amountInKg * finalPricePerKg

    const { rows } = await db.query(
      `UPDATE harvests SET 
        plant_id = COALESCE($2, plant_id),
        date = COALESCE($3::date, date),
        amount = COALESCE($4, amount),
        price_per_kg = COALESCE($5, price_per_kg),
        quality = COALESCE($6, quality),
        revenue = $7,
        notes = COALESCE($8, notes),
        updated_at = NOW()
       WHERE id=$1 AND user_id=$9
       RETURNING *`,
      [
        id,
        plantId ?? null,
        date ?? null,
        amount ?? null,
        pricePerKg ?? null,
        quality ?? null,
        calculatedRevenue,
        notes ?? null,
        req.user.id,
      ]
    )

    const updated = rows[0]
    res.json({
      id: updated.id,
      plantId: updated.plant_id,
      date: updated.date,
      amount: parseFloat(updated.amount),
      unit: updated.unit || 'kg',
      pricePerKg: parseFloat(updated.price_per_kg),
      revenue: parseFloat(updated.revenue),
      quality: updated.quality,
      notes: updated.notes,
      createdAt: updated.created_at,
    })
  } catch (e) {
    res.status(400).json({ message: e.message })
  }
})

// Delete harvest
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { rowCount } = await db.query('DELETE FROM harvests WHERE id=$1 AND user_id=$2', [id, req.user.id])
    if (!rowCount) return res.status(404).json({ message: 'Not found' })
    res.json({ success: true })
  } catch (e) {
    res.status(400).json({ message: e.message })
  }
})

export default router

