import jwt from 'jsonwebtoken'

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ message: 'Unauthorized' })
  try {
    const secret = process.env.JWT_SECRET
    if (!secret) {
      console.error('JWT_SECRET not configured')
      return res.status(500).json({ message: 'Server configuration error' })
    }
    const payload = jwt.verify(token, secret)
    console.log('DEBUG: JWT payload:', payload)
    console.log('DEBUG: payload.id:', payload.id)
    console.log('DEBUG: typeof payload.id:', typeof payload.id)
    console.log('DEBUG: isNaN(payload.id):', isNaN(payload.id))
    
    req.user = { id: payload.id, email: payload.email }
    console.log('DEBUG: req.user set:', req.user)
    next()
  } catch (e) {
    return res.status(401).json({ message: 'Invalid token' })
  }
}
