# AgriBack API Server

Backend API untuk aplikasi Agri Kalcer - Kampung Lestari.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Setup database:
   - Pastikan PostgreSQL sudah terinstall dan berjalan
   - Buat database baru untuk aplikasi ini
   - Jalankan migration SQL untuk membuat tabel:
   ```bash
   psql -U postgres -d nama_database < migrations/001_create_tables.sql
   ```
   Atau copy-paste isi file `migrations/001_create_tables.sql` ke PostgreSQL client

3. Setup environment variables:
   Buat file `.env` dengan konfigurasi:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/database_name
   # atau
   PGHOST=localhost
   PGPORT=5432
   PGDATABASE=nama_database
   PGUSER=postgres
   PGPASSWORD=password
   
   JWT_SECRET=your_secret_key_here
   PORT=4000
   ```

4. Jalankan server:
```bash
npm start
```

Server akan berjalan di `http://localhost:4000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Daftar akun baru
- `POST /api/auth/login` - Login

### Lands (Lahan)
- `GET /api/lands` - Daftar semua lahan user
- `POST /api/lands` - Tambah lahan baru
- `PUT /api/lands/:id` - Update lahan
- `DELETE /api/lands/:id` - Hapus lahan

### Plants (Tanaman)
- `GET /api/plants` - Daftar semua tanaman user
- `POST /api/plants` - Tambah tanaman baru
- `PUT /api/plants/:id` - Update tanaman
- `DELETE /api/plants/:id` - Hapus tanaman

### Finances (Keuangan)
- `GET /api/finances` - Daftar semua transaksi keuangan user
- `POST /api/finances` - Tambah transaksi keuangan
- `PUT /api/finances/:id` - Update transaksi keuangan
- `DELETE /api/finances/:id` - Hapus transaksi keuangan

### Maintenance (Perawatan)
- `GET /api/maintenance` - Daftar semua perawatan user
- `POST /api/maintenance` - Tambah perawatan baru
- `PUT /api/maintenance/:id` - Update perawatan
- `DELETE /api/maintenance/:id` - Hapus perawatan

### Harvests (Panen)
- `GET /api/harvests` - Daftar semua panen user
- `POST /api/harvests` - Tambah panen baru
- `PUT /api/harvests/:id` - Update panen
- `DELETE /api/harvests/:id` - Hapus panen

### Notifications (Notifikasi)
- `GET /api/notifications` - Daftar semua notifikasi user
- `POST /api/notifications` - Tambah notifikasi baru
- `PUT /api/notifications/:id` - Update notifikasi (mark as read)
- `DELETE /api/notifications/:id` - Hapus notifikasi

## Authentication

Semua endpoint (kecuali register/login) memerlukan token JWT di header:
```
Authorization: Bearer <token>
```

Token didapat dari endpoint login atau register.

