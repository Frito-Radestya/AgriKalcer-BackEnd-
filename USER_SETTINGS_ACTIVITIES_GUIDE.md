# Panduan Implementasi User Settings & User Activities

## 📋 User Settings

### Konsep
Tabel `user_settings` digunakan untuk menyimpan pengaturan/preferensi user yang dapat dikustomisasi.

### Saran Implementasi:

#### 1. **Pengaturan Notifikasi**
- `notification_email_enabled` (boolean) - Aktifkan notifikasi via email
- `notification_reminder_days` (number) - Berapa hari sebelum panen untuk reminder (default: 7)
- `notification_types` (json) - Jenis notifikasi yang diaktifkan: `["harvest", "maintenance", "finance"]`

#### 2. **Pengaturan Tampilan**
- `theme` (string) - Tema aplikasi: `"light"` atau `"dark"`
- `language` (string) - Bahasa: `"id"` atau `"en"`
- `date_format` (string) - Format tanggal: `"DD/MM/YYYY"` atau `"YYYY-MM-DD"`

#### 3. **Pengaturan Unit**
- `currency` (string) - Mata uang: `"IDR"`, `"USD"`, dll
- `weight_unit` (string) - Unit berat: `"kg"` atau `"ton"`
- `area_unit` (string) - Unit luas: `"hectare"` atau `"m2"`

#### 4. **Pengaturan Dashboard**
- `dashboard_widgets` (json) - Widget yang ditampilkan di dashboard
- `default_view` (string) - Tampilan default: `"list"` atau `"grid"`

### Contoh Implementasi Backend:

```javascript
// routes/user_settings.js
router.get('/', requireAuth, async (req, res) => {
  const { rows } = await db.query(
    'SELECT setting_key, setting_value, data_type FROM user_settings WHERE user_id = $1',
    [req.user.id]
  )
  
  // Convert to object
  const settings = {}
  rows.forEach(row => {
    let value = row.setting_value
    if (row.data_type === 'boolean') value = value === 'true'
    if (row.data_type === 'number') value = parseFloat(value)
    if (row.data_type === 'json') value = JSON.parse(value)
    settings[row.setting_key] = value
  })
  
  res.json(settings)
})

router.put('/:key', requireAuth, async (req, res) => {
  const { key } = req.params
  const { value } = req.body
  
  let dataType = 'string'
  let settingValue = value
  
  if (typeof value === 'boolean') {
    dataType = 'boolean'
    settingValue = value.toString()
  } else if (typeof value === 'number') {
    dataType = 'number'
    settingValue = value.toString()
  } else if (typeof value === 'object') {
    dataType = 'json'
    settingValue = JSON.stringify(value)
  }
  
  await db.query(
    `INSERT INTO user_settings (user_id, setting_key, setting_value, data_type)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, setting_key)
     DO UPDATE SET setting_value = $3, updated_at = NOW()`,
    [req.user.id, key, settingValue, dataType]
  )
  
  res.json({ success: true })
})
```

### Contoh Penggunaan di Frontend:

```javascript
// context/useSettings.js
const { settings, updateSetting } = useSettings()

// Get notification reminder days
const reminderDays = settings.notification_reminder_days || 7

// Update setting
updateSetting('theme', 'dark')
```

---

## 📊 User Activities

### Konsep
Tabel `user_activities` digunakan untuk logging aktivitas user (audit trail).

### Saran Implementasi:

#### 1. **Jenis Aktivitas yang Dicatat:**
- `login` - User login
- `logout` - User logout
- `plant_created` - Membuat tanaman baru
- `plant_updated` - Update tanaman
- `plant_deleted` - Hapus tanaman
- `harvest_created` - Mencatat panen
- `maintenance_created` - Mencatat perawatan
- `finance_created` - Mencatat transaksi keuangan
- `settings_updated` - Update pengaturan

#### 2. **Metadata yang Disimpan:**
- `ip_address` - IP address user (untuk security)
- `user_agent` - Browser/device info
- `metadata` (JSONB) - Data tambahan sesuai aktivitas:
  ```json
  {
    "plant_id": 123,
    "plant_name": "Padi IR64",
    "action": "created"
  }
  ```

### Contoh Implementasi Backend:

```javascript
// middleware/activityLogger.js
export function logActivity(activityType, description, metadata = {}) {
  return async (req, res, next) => {
    // Log after response is sent
    res.on('finish', async () => {
      if (res.statusCode < 400) { // Only log successful requests
        try {
          const ipAddress = req.ip || req.connection.remoteAddress
          const userAgent = req.get('user-agent')
          
          await db.query(
            `INSERT INTO user_activities (user_id, activity_type, description, ip_address, user_agent, metadata)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              req.user?.id || null,
              activityType,
              description,
              ipAddress,
              userAgent,
              JSON.stringify(metadata)
            ]
          )
        } catch (error) {
          console.error('Error logging activity:', error)
          // Don't fail the request if logging fails
        }
      }
    })
    
    next()
  }
}

// Usage in routes
router.post('/', requireAuth, logActivity('plant_created', 'User created a new plant'), async (req, res) => {
  // ... create plant logic
})
```

### Contoh Query untuk Analytics:

```sql
-- Aktivitas user dalam 30 hari terakhir
SELECT 
  activity_type,
  COUNT(*) as count,
  DATE(created_at) as date
FROM user_activities
WHERE user_id = $1
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY activity_type, DATE(created_at)
ORDER BY date DESC;

-- Most active users
SELECT 
  u.name,
  COUNT(ua.id) as activity_count
FROM user_activities ua
JOIN users u ON ua.user_id = u.id
WHERE ua.created_at >= NOW() - INTERVAL '7 days'
GROUP BY u.id, u.name
ORDER BY activity_count DESC
LIMIT 10;
```

### Manfaat:
1. **Security** - Track login/logout, detect suspicious activity
2. **Analytics** - Lihat aktivitas user, fitur yang paling digunakan
3. **Debugging** - Trace masalah dengan melihat log aktivitas
4. **Compliance** - Audit trail untuk keperluan compliance

---

## 🎯 Rekomendasi Prioritas

### High Priority:
1. ✅ **User Settings untuk Notifikasi** - Reminder days, email preferences
2. ✅ **User Activities untuk Security** - Login/logout logging

### Medium Priority:
3. ⚠️ **User Settings untuk Tampilan** - Theme, language
4. ⚠️ **User Activities untuk Analytics** - Track feature usage

### Low Priority:
5. ⚠️ **User Settings untuk Unit** - Currency, weight unit
6. ⚠️ **User Activities untuk Compliance** - Full audit trail

---

## 📝 Catatan Implementasi

1. **User Settings:**
   - Gunakan default values jika setting belum ada
   - Cache settings di frontend untuk performa
   - Validasi setting values sebelum save

2. **User Activities:**
   - Jangan log sensitive data (password, tokens)
   - Implementasi retention policy (hapus log > 1 tahun)
   - Gunakan background job untuk logging agar tidak slow down requests

3. **Performance:**
   - Index pada `user_id` dan `created_at` untuk query cepat
   - Pertimbangkan archiving old activities ke separate table
   - Gunakan batch insert untuk multiple activities

