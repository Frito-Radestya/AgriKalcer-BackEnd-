# Analisis Backend Database Implementation

## ✅ Yang Sudah Baik

1. **Struktur Query** - Query SQL sudah menggunakan parameterized queries (mencegah SQL injection)
2. **Authentication** - Semua route protected menggunakan `requireAuth` middleware
3. **User Isolation** - Semua query sudah filter berdasarkan `user_id` untuk keamanan data
4. **Foreign Key Validation** - Ada validasi untuk memastikan plant/land belongs to user sebelum insert
5. **Error Handling** - Ada try-catch di semua route handlers

## ⚠️ Masalah yang Ditemukan

### 1. **Harvests Route - Revenue Calculation Bug**
**File:** `src/routes/harvests.js` line 118

**Masalah:**
```javascript
revenue = COALESCE($6, revenue, amount * price_per_kg)
```
Ini akan selalu menggunakan nilai lama `revenue` jika `$6` null, padahal seharusnya recalculate jika amount atau price_per_kg berubah.

**Solusi:**
```javascript
revenue = CASE 
  WHEN $4 IS NOT NULL AND $5 IS NOT NULL THEN $4 * $5
  WHEN $4 IS NOT NULL AND price_per_kg IS NOT NULL THEN $4 * price_per_kg
  WHEN amount IS NOT NULL AND $5 IS NOT NULL THEN amount * $5
  ELSE COALESCE($6, revenue)
END
```

### 2. **Notifications Route - Schema Compatibility Issue**
**File:** `src/routes/notifications.js`

**Masalah:**
- Ada workaround untuk schema lama yang seharusnya tidak diperlukan lagi
- Query ke `information_schema` setiap request tidak efisien

**Solusi:**
- Hapus compatibility code untuk schema lama
- Gunakan schema baru secara konsisten (is_read, related_entity_type, related_entity_id)

### 3. **Missing Input Validation**
**Masalah:**
- Tidak ada validasi untuk:
  - Email format
  - Date format
  - Amount harus positif
  - String length limits
  - Enum values (type, status, category)

**Solusi:**
- Tambahkan validation middleware atau library seperti `joi` atau `express-validator`

### 4. **No Pagination**
**Masalah:**
- Semua GET endpoints return semua data tanpa pagination
- Bisa menyebabkan masalah performa jika data banyak

**Solusi:**
- Tambahkan pagination dengan `LIMIT` dan `OFFSET`
- Default: limit 50, max 100

### 5. **Missing Database Transactions**
**Masalah:**
- Operasi yang terkait tidak menggunakan transaction:
  - Create harvest → update plant status
  - Create maintenance → create finance (jika ada cost)

**Solusi:**
- Gunakan database transaction untuk operasi multi-step

### 6. **Unused Database Tables**
**Tabel yang ada di schema tapi tidak digunakan:**
- `reminders` - Untuk pengingat perawatan
- `maintenance_logs` - Log perawatan
- `productivity_metrics` - Metrik produktivitas
- `user_settings` - Pengaturan user
- `user_activities` - Log aktivitas user
- `message_templates` - Template notifikasi

**Saran:**
- Implementasikan fitur-fitur ini atau hapus tabelnya jika tidak diperlukan

### 7. **Security Concerns**

#### a. JWT Secret Default
```javascript
process.env.JWT_SECRET || 'dev_secret_change_me'
```
**Masalah:** Default secret tidak aman untuk production

**Solusi:** Wajibkan JWT_SECRET di production, throw error jika tidak ada

#### b. No Rate Limiting
**Masalah:** Tidak ada rate limiting untuk prevent brute force

**Solusi:** Tambahkan rate limiting dengan `express-rate-limit`

#### c. Password Policy
**Masalah:** Tidak ada validasi password strength

**Solusi:** Tambahkan validasi minimal 8 karakter, kombinasi huruf/angka

### 8. **Performance Issues**

#### a. N+1 Query Problem
**File:** `src/routes/plants.js` line 28-38

**Masalah:** Query sudah baik dengan JOIN, tapi bisa dioptimasi lebih lanjut

**Saran:** Pertimbangkan untuk menambahkan index pada:
- `plants.user_id` (sudah ada)
- `plants.land_id` (sudah ada)
- `plants.plant_type_id` (belum ada)

#### b. Missing Indexes
**Saran tambahan:**
```sql
CREATE INDEX IF NOT EXISTS idx_plants_status ON plants(status);
CREATE INDEX IF NOT EXISTS idx_plants_planting_date ON plants(planting_date);
CREATE INDEX IF NOT EXISTS idx_plants_plant_type_id ON plants(plant_type_id);
```

### 9. **Data Consistency Issues**

#### a. Plant Status Update
**File:** `src/routes/harvests.js` line 63-66

**Masalah:** Update plant status ke 'harvested' tanpa cek apakah sudah harvested sebelumnya

**Solusi:** Cek status dulu, atau biarkan multiple harvests untuk satu plant

#### b. Finance Auto-creation
**Masalah:** Frontend yang create finance dari maintenance/harvest, bukan backend

**Saran:** Pertimbangkan trigger database atau backend logic untuk auto-create finance

### 10. **Error Messages**
**Masalah:** Error messages terlalu generic, tidak informatif untuk debugging

**Saran:** 
- Log error details ke console/log file
- Return user-friendly messages
- Jangan expose internal error details ke client

### 11. **Missing Features dari Schema**

#### a. Updated_at Auto-update
**Masalah:** Beberapa query manual update `updated_at`, beberapa tidak

**Solusi:** Gunakan database trigger untuk auto-update `updated_at`:
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Repeat for other tables
```

#### b. Soft Delete
**Saran:** Pertimbangkan soft delete dengan kolom `deleted_at` untuk data recovery

## 📋 Rekomendasi Prioritas

### High Priority (Perlu Segera)
1. ✅ Fix revenue calculation bug di harvests
2. ✅ Tambahkan input validation
3. ✅ Fix JWT secret requirement
4. ✅ Tambahkan pagination

### Medium Priority
5. ✅ Implementasi database transactions
6. ✅ Optimasi notifications route (hapus compatibility code)
7. ✅ Tambahkan rate limiting
8. ✅ Tambahkan index yang missing

### Low Priority
9. ✅ Implementasi unused tables atau hapus
10. ✅ Tambahkan soft delete
11. ✅ Auto-update updated_at dengan trigger
12. ✅ Improve error messages

## 🔧 Contoh Perbaikan

### 1. Fix Harvests Revenue Calculation
```javascript
// Update harvest
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { plantId, date, amount, pricePerKg, notes } = req.body

    // Verify harvest belongs to user
    const { rows: existing } = await db.query(
      'SELECT id, amount, price_per_kg, revenue FROM harvests WHERE id=$1 AND user_id=$2',
      [id, req.user.id]
    )
    if (!existing.length) {
      return res.status(404).json({ message: 'Not found' })
    }

    const current = existing[0]
    const finalAmount = amount ?? parseFloat(current.amount)
    const finalPricePerKg = pricePerKg ?? parseFloat(current.price_per_kg)
    const calculatedRevenue = finalAmount * finalPricePerKg

    const { rows } = await db.query(
      `UPDATE harvests SET 
        plant_id = COALESCE($2, plant_id),
        date = COALESCE($3::date, date),
        amount = COALESCE($4, amount),
        price_per_kg = COALESCE($5, price_per_kg),
        revenue = $6,
        notes = COALESCE($7, notes),
        updated_at = NOW()
       WHERE id=$1 AND user_id=$8
       RETURNING *`,
      [
        id,
        plantId ?? null,
        date ?? null,
        amount ?? null,
        pricePerKg ?? null,
        calculatedRevenue,
        notes ?? null,
        req.user.id,
      ]
    )
    // ... rest of code
  }
})
```

### 2. Add Pagination Helper
```javascript
// utils/pagination.js
export function getPaginationParams(req) {
  const page = Math.max(1, parseInt(req.query.page) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50))
  const offset = (page - 1) * limit
  return { page, limit, offset }
}

// Usage in routes
router.get('/', requireAuth, async (req, res) => {
  const { limit, offset } = getPaginationParams(req)
  const { rows } = await db.query(
    `SELECT ... FROM plants WHERE user_id = $1 
     ORDER BY created_at DESC 
     LIMIT $2 OFFSET $3`,
    [req.user.id, limit, offset]
  )
  // Also return total count for pagination UI
  const { rows: countRows } = await db.query(
    'SELECT COUNT(*) as total FROM plants WHERE user_id = $1',
    [req.user.id]
  )
  res.json({
    data: rows,
    pagination: {
      page: Math.floor(offset / limit) + 1,
      limit,
      total: parseInt(countRows[0].total)
    }
  })
})
```

### 3. Add Input Validation
```javascript
// middleware/validation.js
import { body, validationResult } from 'express-validator'

export const validateFinance = [
  body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
  body('date').isISO8601().withMessage('Date must be valid ISO date'),
  (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    next()
  }
]

// Usage
router.post('/', requireAuth, validateFinance, async (req, res) => {
  // ...
})
```

### 4. Add Database Transaction
```javascript
// Example: Create harvest with plant status update
router.post('/', requireAuth, async (req, res) => {
  const client = await db.pool.connect()
  try {
    await client.query('BEGIN')
    
    // Create harvest
    const { rows } = await client.query(
      `INSERT INTO harvests ... RETURNING *`,
      [...]
    )
    
    // Update plant status
    await client.query(
      'UPDATE plants SET status=$1 WHERE id=$2',
      ['harvested', plantId]
    )
    
    await client.query('COMMIT')
    res.status(201).json(rows[0])
  } catch (e) {
    await client.query('ROLLBACK')
    res.status(400).json({ message: e.message })
  } finally {
    client.release()
  }
})
```

## 📊 Summary

**Overall Assessment:** Backend sudah cukup baik dengan struktur yang solid, tapi ada beberapa area yang perlu diperbaiki untuk production-ready:

- ✅ Security: Good (dengan beberapa improvements needed)
- ⚠️ Data Integrity: Good (but needs transactions)
- ⚠️ Performance: Fair (needs pagination and indexes)
- ⚠️ Code Quality: Good (but needs validation)
- ⚠️ Feature Completeness: Fair (many unused tables)

**Score: 7/10** - Solid foundation, but needs improvements for production.

