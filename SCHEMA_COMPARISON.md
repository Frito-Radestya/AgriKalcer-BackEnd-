# Perbandingan Schema Database

## Tabel yang Sudah Ada di Database Anda ✓

1. **users** - ✓ Sudah ada dan sesuai
2. **lands** - ✓ Sudah ada dan sesuai
3. **plants** - ✓ Sudah ada dan sesuai
4. **plant_types** - ✓ Sudah ada dan sesuai
5. **notifications** - ✓ Sudah ada tapi struktur sedikit berbeda (sudah disesuaikan di backend)
6. **reminders** - ✓ Sudah ada (untuk pengingat perawatan)
7. **maintenance_logs** - ✓ Sudah ada (log perawatan yang sudah dilakukan)
8. **productivity_metrics** - ✓ Sudah ada (metrik produktivitas tanaman)
9. **user_settings** - ✓ Sudah ada (pengaturan user)
10. **user_activities** - ✓ Sudah ada (aktivitas user)
11. **message_templates** - ✓ Sudah ada (template pesan notifikasi)

## Tabel yang Perlu Ditambahkan

Jalankan migration `002_add_missing_tables.sql` untuk menambahkan:

1. **finances** - ❌ Belum ada (untuk data keuangan: income/expense)
2. **harvests** - ❌ Belum ada (untuk data panen)
3. **maintenance** - ❌ Belum ada (perawatan sederhana - berbeda dengan maintenance_logs)

## Perbedaan Schema Notifications

### Schema yang Sudah Ada (Lebih Fleksibel):
```sql
- is_read (BOOLEAN)
- related_entity_type (VARCHAR) -- 'plant', 'reminder', dll
- related_entity_id (INTEGER)
- read_at (TIMESTAMP)
```

### Schema yang Saya Buat Awalnya:
```sql
- read (BOOLEAN)
- plant_id (INTEGER)
```

**Status:** ✅ Backend sudah disesuaikan untuk mendukung kedua struktur

## Perbedaan Maintenance vs Maintenance Logs

### maintenance (baru - sederhana):
```sql
- user_id
- plant_id
- type (VARCHAR) -- 'watering', 'fertilizing', dll
- date (DATE)
- notes (TEXT)
- cost (DECIMAL)
```

### maintenance_logs (sudah ada - lebih kompleks):
```sql
- user_id
- plant_id
- reminder_id (INTEGER) -- link ke reminders
- activity_type (VARCHAR)
- description (TEXT)
- notes (TEXT)
- performed_at (TIMESTAMP)
```

**Rekomendasi:** 
- Gunakan `maintenance` untuk perawatan sederhana yang tidak terkait dengan reminders
- Gunakan `maintenance_logs` untuk mencatat ketika reminder sudah dikerjakan
- Atau bisa merge keduanya, tapi butuh refactor backend

## Langkah Selanjutnya

1. ✅ Jalankan migration `002_add_missing_tables.sql`
2. ✅ Backend sudah disesuaikan untuk notifications
3. ⚠️ Pertimbangkan untuk merge `maintenance` dan `maintenance_logs` di masa depan
4. 💡 Tabel `reminders` bisa diintegrasikan dengan sistem notifikasi yang sudah ada

