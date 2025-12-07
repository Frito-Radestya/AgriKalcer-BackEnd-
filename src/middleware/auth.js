import jwt from 'jsonwebtoken'
import db from '../db.js'

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Tidak ada token, otentikasi ditolak' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
    if (!rows.length) {
      return res.status(401).json({ message: 'Token tidak valid' });
    }

    req.user = rows[0];
    next();
  } catch (error) {
    console.error('Error autentikasi:', error);
    return res.status(401).json({ message: 'Token tidak valid' });
  }
};

export const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Anda belum login' });
    }
    
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Akses ditolak' });
    }
    
    next();
  };
};

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
