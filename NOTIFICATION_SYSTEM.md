# Sistem Notifikasi - Message Templates & AI Suggestions

## 📋 Konsep

Sistem notifikasi menggunakan **2 sumber data**:

1. **Message Templates** - Template pesan untuk 4 jenis pengingat perawatan:
   - `reminder_watering` - Pengingat Penyiraman
   - `reminder_fertilizing` - Pengingat Pemupukan
   - `reminder_weeding` - Pengingat Penyiangan
   - `reminder_pesticide` - Pengingat Pestisida

2. **AI Suggestions** - Saran AI yang dinamis berdasarkan kondisi tanaman:
   - Pantau keadaan tanaman secara berkala
   - Waspada hama dan penyakit
   - Perawatan tertunda
   - Persiapan panen
   - Tips musim hujan

## 🔄 Cara Kerja

### 1. Notifikasi dari Message Templates

**Kapan dibuat:**
- Saat user membuat maintenance record dengan type tertentu
- Type maintenance akan di-map ke template:
  - `penyiraman` / `watering` → `reminder_watering`
  - `pemupukan` / `fertilizing` → `reminder_fertilizing`
  - `penyiangan` / `weeding` → `reminder_weeding`
  - `pestisida` / `pesticide` → `reminder_pesticide`

**Proses:**
1. User membuat maintenance (POST `/api/maintenance`)
2. System mengambil template dari `message_templates` berdasarkan type
3. Template variables di-replace dengan data aktual:
   - `{plant_name}` → Nama tanaman
   - `{land_name}` → Nama lahan
   - `{watering_description}` → Deskripsi penyiraman
   - `{activity_description}` → Deskripsi aktivitas
   - `{day}` → Hari ke-berapa sejak tanam
4. Notification dibuat di tabel `notifications` dengan `related_entity_type = 'plant'`

### 2. Notifikasi AI Suggestions

**Kapan dibuat:**
- Otomatis saat user fetch notifications (GET `/api/notifications`)
- Manual via endpoint (POST `/api/notifications/generate-ai-suggestions`)
- Hanya 1 kali per hari (untuk menghindari spam)

**Jenis Suggestions:**

1. **Pantau Keadaan Tanaman**
   - Trigger: Ada tanaman aktif
   - Message: "Pantau keadaan X tanaman aktif Anda secara berkala..."

2. **Perawatan Tertunda**
   - Trigger: Ada maintenance yang tertunda > 7 hari
   - Message: "Anda memiliki X perawatan yang tertunda..."

3. **Musim Hujan**
   - Trigger: Bulan Oktober - Maret
   - Message: "Musim hujan telah tiba. Perhatikan drainase..."

4. **Persiapan Panen**
   - Trigger: Ada panen dalam 14 hari ke depan
   - Message: "Anda memiliki X tanaman yang akan panen..."

## 📁 File yang Terlibat

### Backend Routes:
- `src/routes/notifications.js` - CRUD notifications + AI suggestions
- `src/routes/message_templates.js` - CRUD message templates
- `src/routes/maintenance.js` - Auto-create notification dari template

### Helper Functions:
- `src/utils/notificationHelper.js` - Helper untuk generate notifications

## 🔌 API Endpoints

### Notifications

```bash
# Get all notifications (auto-generate AI suggestions)
GET /api/notifications
Response: {
  data: [
    {
      id: 1,
      title: "Pengingat Penyiraman Padi IR64",
      message: "Waktunya penyiraman setiap 3 hari untuk Padi IR64...",
      type: "info",
      read: false,
      source: "template", // atau "ai"
      plantId: 123,
      createdAt: "2024-01-15T10:00:00Z"
    },
    {
      id: 2,
      title: "Pantau Keadaan Tanaman",
      message: "Pantau keadaan 5 tanaman aktif Anda...",
      type: "warning",
      read: false,
      source: "ai",
      plantId: null,
      createdAt: "2024-01-15T10:00:00Z"
    }
  ]
}

# Mark notification as read
PUT /api/notifications/:id
Body: { read: true }

# Delete notification
DELETE /api/notifications/:id

# Generate AI suggestions manually
POST /api/notifications/generate-ai-suggestions
Response: {
  success: true,
  message: "Generated 3 AI suggestion notifications",
  count: 3
}
```

### Message Templates

```bash
# Get all templates
GET /api/message-templates

# Get template by key
GET /api/message-templates/:key

# Update template (admin)
PUT /api/message-templates/:key
Body: {
  title_template: "Pengingat Penyiraman {plant_name}",
  message_template: "Waktunya {watering_description} untuk {plant_name}...",
  variables: ["plant_name", "land_name", "watering_description"]
}
```

## 🗄️ Database Schema

### message_templates
```sql
- id (SERIAL PRIMARY KEY)
- template_key (VARCHAR UNIQUE) - 'reminder_watering', dll
- title_template (TEXT) - Template dengan {variables}
- message_template (TEXT) - Template dengan {variables}
- description (TEXT)
- variables (JSONB) - Array variable names
```

### notifications
```sql
- id (SERIAL PRIMARY KEY)
- user_id (INTEGER REFERENCES users)
- title (VARCHAR) - Title yang sudah di-replace
- message (TEXT) - Message yang sudah di-replace
- type (VARCHAR) - 'info', 'warning', 'success', 'error'
- is_read (BOOLEAN)
- related_entity_type (VARCHAR) - 'plant', 'ai_suggestion'
- related_entity_id (INTEGER) - Plant ID jika related_entity_type = 'plant'
- created_at (TIMESTAMP)
- read_at (TIMESTAMP)
```

## 💡 Contoh Penggunaan

### 1. User Membuat Maintenance Penyiraman

```javascript
// POST /api/maintenance
{
  "plantId": 123,
  "type": "penyiraman",
  "date": "2024-01-15",
  "notes": "Penyiraman pagi hari"
}

// System akan:
// 1. Create maintenance record
// 2. Create maintenance_log
// 3. Get template 'reminder_watering'
// 4. Replace variables:
//    - {plant_name} → "Padi IR64"
//    - {land_name} → "Lahan Utara"
//    - {watering_description} → "setiap 3 hari"
// 5. Create notification dengan title & message yang sudah di-replace
```

### 2. User Membuka Notifikasi

```javascript
// GET /api/notifications
// System akan:
// 1. Check apakah sudah generate AI suggestions hari ini
// 2. Jika belum, generate AI suggestions:
//    - Check tanaman aktif
//    - Check maintenance tertunda
//    - Check musim
//    - Check panen mendatang
// 3. Return semua notifications (template + AI)
```

## 🎨 Frontend Integration

### Display Notifications

```jsx
// Component Notifications
const { notifications } = useData()

// Filter by source
const templateNotifications = notifications.filter(n => n.source === 'template')
const aiNotifications = notifications.filter(n => n.source === 'ai')

// Display dengan badge
{notifications.map(notif => (
  <div key={notif.id}>
    {notif.source === 'ai' && <Badge>AI Suggestion</Badge>}
    <h3>{notif.title}</h3>
    <p>{notif.message}</p>
  </div>
))}
```

### Icon Badge Count

```jsx
// Layout.jsx - Icon bell dengan badge
const unreadCount = notifications.filter(n => !n.read).length

<Button onClick={() => navigate('/notifications')}>
  <Bell />
  {unreadCount > 0 && (
    <Badge>{unreadCount}</Badge>
  )}
</Button>
```

## 🔧 Customization

### Menambah Template Baru

```sql
INSERT INTO message_templates (template_key, title_template, message_template, description, variables)
VALUES (
  'reminder_harvest',
  'Pengingat Panen {plant_name}',
  'Tanaman {plant_name} di lahan {land_name} siap untuk dipanen!',
  'Template untuk pengingat panen',
  '["plant_name", "land_name"]'::jsonb
);
```

### Menambah AI Suggestion Baru

Edit `src/utils/notificationHelper.js` → function `createAISuggestionNotification`:

```javascript
// Add new suggestion
if (someCondition) {
  suggestions.push({
    title: 'Judul Saran',
    message: 'Pesan saran AI',
    type: 'info',
    priority: 'medium'
  })
}
```

## 📊 Priority & Ordering

Notifications diurutkan dengan:
1. **AI Suggestions** dulu (priority tinggi)
2. **Template Notifications** kemudian
3. **Created At** (terbaru dulu)

## ✅ Checklist

- [x] Route untuk message_templates
- [x] Helper untuk generate notification dari template
- [x] Helper untuk generate AI suggestions
- [x] Auto-create notification saat maintenance dibuat
- [x] Auto-generate AI suggestions saat fetch notifications
- [x] Endpoint manual untuk trigger AI suggestions
- [x] Support untuk kedua jenis notification di response
- [ ] Frontend component untuk display notifications
- [ ] Frontend integration dengan bell icon

---

**Status:** ✅ Backend selesai, siap untuk frontend integration!

