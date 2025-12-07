import express from 'express'
import db from '../db.js'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

const router = express.Router()

// Generate random password
function generateRandomPassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Request password reset - menampilkan password baru langsung
router.post('/forgot-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body
    
    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: 'Email harus diisi' 
      })
    }

    // Validasi password custom jika ada
    if (newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password minimal 6 karakter'
        })
      }
    }

    // Check if user exists
    const { rows } = await db.query('SELECT id, name, email FROM users WHERE email = $1', [email])
    const user = rows[0]
    
    if (!user) {
      // Don't reveal if email exists or not
      return res.json({ 
        success: true,
        message: 'Jika email terdaftar, password baru akan ditampilkan' 
      })
    }

    // Generate atau gunakan password yang disediakan
    const passwordToUse = newPassword || generateRandomPassword()
    const hashedPassword = await bcrypt.hash(passwordToUse, 10)

    // Update password in database
    await db.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, user.id]
    )

    // Return success dengan password
    res.json({ 
      success: true,
      message: 'Password berhasil direset',
      newPassword: passwordToUse, // Password yang digunakan
      email: user.email
    })
    
  } catch (error) {
    console.error('Error forgot password:', error)
    res.status(500).json({ 
      success: false,
      message: 'Terjadi kesalahan server. Silakan coba lagi nanti.' 
    })
  }
})

// Reset password dengan token (jika tetap ingin menggunakan token)
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword, email } = req.body
    
    if (!token || !newPassword || !email) {
      return res.status(400).json({ 
        success: false,
        message: 'Token, email, dan password baru diperlukan' 
      })
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ 
        success: false,
        message: 'Password minimal 8 karakter' 
      })
    }

    // Get user with valid token
    const { rows } = await db.query(
      `SELECT id FROM users 
       WHERE email = $1 AND reset_token = $2 
       AND reset_token_expiry > NOW()`,
      [email, token]
    )

    if (rows.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Token tidak valid atau sudah kedaluwarsa' 
      })
    }

    const user = rows[0]
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update password and clear reset token
    await db.query(
      `UPDATE users 
       SET password = $1, reset_token = NULL, reset_token_expiry = NULL 
       WHERE id = $2`,
      [hashedPassword, user.id]
    )

    res.json({ 
      success: true,
      message: 'Password berhasil direset. Silakan login dengan password baru Anda.' 
    })
  } catch (error) {
    console.error('Error reset password:', error)
    res.status(500).json({ 
      success: false,
      message: 'Terjadi kesalahan server. Silakan coba lagi nanti.' 
    })
  }
})

// Change password (authenticated user)
router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword, email } = req.body
    
    if (!currentPassword || !newPassword || !email) {
      return res.status(400).json({ 
        success: false,
        message: 'Password saat ini, password baru, dan email diperlukan' 
      })
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ 
        success: false,
        message: 'Password minimal 8 karakter' 
      })
    }

    // Find user by email
    const { rows } = await db.query('SELECT id, name, email, password FROM users WHERE email = $1', [email])
    const user = rows[0]
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Pengguna tidak ditemukan' 
      })
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password)
    if (!isValidPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'Password saat ini salah' 
      })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update password
    await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, user.id])

    res.json({ 
      success: true,
      message: 'Password berhasil diubah' 
    })
  } catch (error) {
    console.error('Error change password:', error)
    res.status(500).json({ 
      success: false,
      message: 'Terjadi kesalahan server. Silakan coba lagi nanti.' 
    })
  }
})

export default router
