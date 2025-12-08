import express from 'express';

const router = express.Router();

router.get('/env', (req, res) => {
  // Cek environment variables yang dibutuhkan untuk email
  const emailConfig = {
    SMTP_HOST: process.env.SMTP_HOST ? 'SET' : 'NOT_SET',
    SMTP_PORT: process.env.SMTP_PORT || 'NOT_SET',
    SMTP_SECURE: process.env.SMTP_SECURE || 'NOT_SET',
    SMTP_USER: process.env.SMTP_USER ? 'SET' : 'NOT_SET',
    SMTP_PASS: process.env.SMTP_PASS ? 'SET' : 'NOT_SET',
    SMTP_FROM: process.env.SMTP_FROM || 'NOT_SET',
    NODE_ENV: process.env.NODE_ENV || 'development'
  };

  res.json({
    timestamp: new Date().toISOString(),
    emailConfig
  });
});

export default router;
