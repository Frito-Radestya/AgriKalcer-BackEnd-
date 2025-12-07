import db from '../db.js';
import { encrypt } from '../utils/emailConfig.js';

// Get active email configuration
export const getActiveConfig = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, smtp_host, smtp_port, smtp_secure, 
              smtp_user, from_email, from_name, is_active
       FROM email_settings 
       WHERE is_active = true 
       ORDER BY id DESC 
       LIMIT 1`
    );
    
    res.json({ success: true, data: rows[0] || null });
  } catch (error) {
    console.error('Error getting email settings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Gagal mengambil pengaturan email' 
    });
  }
};

// Save email configuration
export const saveConfig = async (req, res) => {
  const {
    smtp_host,
    smtp_port = 587,
    smtp_secure = false,
    smtp_user,
    smtp_password,
    from_email,
    from_name = 'Lumbung Tani'
  } = req.body;

  try {
    // Validate required fields
    if (!smtp_host || !smtp_user || !smtp_password || !from_email) {
      return res.status(400).json({ 
        success: false, 
        message: 'SMTP host, user, password, dan email pengirim wajib diisi' 
      });
    }

    // Encrypt password before saving using the same key as decryption
    const encryptionKey = process.env.ENCRYPTION_KEY || 'default-encryption-key-32-char-long';
    const encryptedPassword = encrypt(smtp_password, encryptionKey);

    // Start transaction
    await db.query('BEGIN');

    // Deactivate all other configurations
    await db.query(
      'UPDATE email_settings SET is_active = false, updated_at = NOW()'
    );

    // Save new configuration
    const { rows } = await db.query(
      `INSERT INTO email_settings 
       (smtp_host, smtp_port, smtp_secure, smtp_user, smtp_password, 
        from_email, from_name, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       RETURNING id, smtp_host, smtp_port, smtp_secure, smtp_user, 
                 from_email, from_name, is_active, created_at, updated_at`,
      [
        smtp_host,
        smtp_port,
        smtp_secure,
        smtp_user,
        encryptedPassword,
        from_email,
        from_name
      ]
    );

    await db.query('COMMIT');
    res.json({ success: true, data: rows[0] });

  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Error saving email settings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Gagal menyimpan pengaturan email',
      error: error.message 
    });
  }
};

// Test SMTP connection
export const testConnection = async (req, res) => {
  const { getEmailTransporter } = await import('../utils/emailConfig.js');
  
  try {
    const transporter = await getEmailTransporter();
    
    // Test connection
    await transporter.verify();
    
    res.json({ 
      success: true, 
      message: 'Berhasil terhubung ke server SMTP' 
    });
  } catch (error) {
    console.error('SMTP connection error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Gagal terhubung ke server SMTP',
      error: error.message 
    });
  }
};
