import express from 'express'
import db from '../db.js'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

const router = express.Router()

// Generate reset token
function generateResetToken() {
  return crypto.randomBytes(32).toString('hex')
}

// Request password reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' })
    }

    // Check if user exists
    const { rows } = await db.query('SELECT id, name FROM users WHERE email=$1', [email])
    const user = rows[0]
    
    if (!user) {
      // Don't reveal if email exists or not
      return res.json({ message: 'If the email exists, a reset link has been sent' })
    }

    // Generate reset token
    const resetToken = generateResetToken()
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour

    // Save reset token to database
    await db.query(
      'UPDATE users SET reset_token=$1, reset_token_expiry=$2 WHERE id=$3',
      [resetToken, resetTokenExpiry, user.id]
    )

    // For now, just return the token (in production, send email)
    const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`
    
    console.log(`Password reset link for ${email}: ${resetLink}`)
    
    res.json({ 
      message: 'Password reset link generated',
      // In production, remove this and send email instead
      resetLink: process.env.NODE_ENV === 'development' ? resetLink : undefined
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body
    
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' })
    }

    // Check if token is valid and not expired
    const { rows } = await db.query(
      'SELECT id FROM users WHERE reset_token=$1 AND reset_token_expiry > NOW()',
      [token]
    )
    
    const user = rows[0]
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update password and clear reset token
    await db.query(
      'UPDATE users SET password=$1, reset_token=NULL, reset_token_expiry=NULL WHERE id=$2',
      [hashedPassword, user.id]
    )

    res.json({ message: 'Password reset successful' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router
