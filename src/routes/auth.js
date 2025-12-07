import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../db.js'
import { sendMail } from '../utils/emailConfig.js'

const router = express.Router()

function sign(user) {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required')
  }
  const payload = { id: user.id, email: user.email }
  const token = jwt.sign(payload, secret, {
    expiresIn: '7d',
  })
  return token
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' })

    const { rows: existing } = await db.query('SELECT id FROM users WHERE email=$1', [email])
    if (existing.length) return res.status(409).json({ message: 'Email already registered' })

    const hash = await bcrypt.hash(password, 10)
    const { rows } = await db.query(
      'INSERT INTO users (name, email, password) VALUES ($1,$2,$3) RETURNING id, name, email, role, created_at',
      [name, email, hash]
    )
    const user = rows[0]
    const token = sign(user)
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, created_at: user.created_at } })
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ message: 'Missing fields' })

    const { rows } = await db.query('SELECT id, name, email, password, role, created_at FROM users WHERE email=$1', [email])
    const user = rows[0]
    if (!user) return res.status(401).json({ message: 'Invalid credentials' })

    const ok = await bcrypt.compare(password, user.password)
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' })

    const token = sign(user)
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, created_at: user.created_at || new Date().toISOString() } })
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// Request reset password via 6-digit OTP
router.post('/request-reset-otp', async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ message: 'Email is required' })
    }

    // Cek apakah user ada, tapi jangan bocorkan ke client ketika tidak ada
    const { rows: users } = await db.query('SELECT id, email FROM users WHERE email=$1', [email])
    const user = users[0]

    if (user) {
      // Generate OTP 6 digit
      const otp = String(Math.floor(100000 + Math.random() * 900000))

      // Expired dalam 15 menit
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

      // Simpan ke tabel password_reset_otps
      await db.query(
        `INSERT INTO password_reset_otps (email, otp, expires_at, used)
         VALUES ($1, $2, $3, FALSE)`,
        [email, otp, expiresAt]
      )

      // Kirim OTP lewat email menggunakan konfigurasi SMTP aktif
      try {
        const subject = 'Kode OTP Reset Password Lumbung Tani'
        const html = `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a5276;">Kode OTP Reset Password</h2>
            <p>Anda baru saja meminta reset password untuk akun Lumbung Tani dengan email <strong>${email}</strong>.</p>
            <p>Masukkan kode berikut pada halaman reset password:</p>
            <div style="background-color: #f8f9fa; border-left: 4px solid #3498db; padding: 12px 20px; margin: 20px 0; font-family: monospace; font-size: 20px; letter-spacing: 4px;">
              ${otp}
            </div>
            <p style="margin-top: 16px;">Kode ini berlaku selama <strong>15 menit</strong>. Jika Anda tidak merasa meminta reset password, Anda bisa mengabaikan email ini.</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 0.9em; color: #7f8c8d;">
              <p>Email ini dikirim otomatis, mohon tidak membalas email ini.</p>
              <p>© ${new Date().getFullYear()} Lumbung Tani. Semua hak dilindungi.</p>
            </div>
          </div>
        `

        const emailResult = await sendMail({ to: email, subject, html })
        if (!emailResult.success) {
          console.error('Gagal mengirim email OTP:', emailResult.error)
        }
      } catch (mailErr) {
        console.error('Error saat mengirim email OTP:', mailErr)
      }

      // Tetap log OTP ke console untuk keperluan debug/dev
      console.log(`🔐 OTP reset password untuk ${email}: ${otp}`)
    }

    // Selalu respon sukses agar tidak bocorkan apakah email terdaftar
    return res.json({
      success: true,
      message: 'Jika email terdaftar, kode OTP telah dikirim.',
    })
  } catch (e) {
    console.error('Error in /auth/request-reset-otp:', e)
    return res.status(500).json({ message: 'Gagal memproses permintaan reset password.' })
  }
})

// Reset password menggunakan OTP 6 digit
router.post('/reset-password-otp', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, dan password baru wajib diisi' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password baru minimal 6 karakter' })
    }

    // Cari OTP yang masih berlaku
    const { rows: otpRows } = await db.query(
      `SELECT id, email, otp, expires_at, used
       FROM password_reset_otps
       WHERE email = $1 AND otp = $2 AND used = FALSE
       ORDER BY created_at DESC
       LIMIT 1`,
      [email, otp]
    )

    const otpEntry = otpRows[0]

    if (!otpEntry) {
      return res.status(400).json({ message: 'OTP salah atau sudah tidak berlaku' })
    }

    // Cek expired
    const now = new Date()
    const expiresAt = new Date(otpEntry.expires_at)
    if (now > expiresAt) {
      return res.status(400).json({ message: 'OTP sudah kedaluwarsa' })
    }

    // Pastikan user ada
    const { rows: users } = await db.query('SELECT id FROM users WHERE email=$1', [email])
    const user = users[0]
    if (!user) {
      return res.status(400).json({ message: 'Pengguna dengan email ini tidak ditemukan' })
    }

    // Hash password baru
    const hash = await bcrypt.hash(newPassword, 10)

    // Update password user
    await db.query('UPDATE users SET password=$1 WHERE id=$2', [hash, user.id])

    // Tandai OTP sebagai used
    await db.query('UPDATE password_reset_otps SET used=TRUE WHERE id=$1', [otpEntry.id])

    return res.json({ success: true, message: 'Password berhasil direset. Silakan login kembali.' })
  } catch (e) {
    console.error('Error in /auth/reset-password-otp:', e)
    return res.status(500).json({ message: 'Gagal mereset password.' })
  }
})

export default router
