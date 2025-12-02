import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../db.js'

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

export default router
