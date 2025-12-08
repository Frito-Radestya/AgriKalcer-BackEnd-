import express from 'express';
import { sendMail } from '../utils/emailConfig.js';
import db from '../db.js';

const router = express.Router();

// Test kirim OTP yang tersimpan di tabel password_reset_otps
router.get('/test-otp', async (req, res) => {
  const email = req.query.email || 'frito.radestya@gmail.com';

  try {
    console.log('[TEST-OTP] Cari OTP untuk email:', email);

    // Ambil OTP terbaru dari password_reset_otps
    const { rows } = await db.query(
      `SELECT * FROM password_reset_otps
       WHERE email = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [email]
    );

    if (rows.length === 0) {
      console.log('[TEST-OTP] Tidak ada OTP untuk email ini');
      return res.status(404).json({
        success: false,
        message: 'Tidak ada OTP yang ditemukan untuk email ini'
      });
    }

    const otpData = rows[0];
    console.log('[TEST-OTP] OTP ditemukan:', {
      id: otpData.id,
      otp: otpData.otp,
      expires_at: otpData.expires_at,
      used: otpData.used
    });

    // Kirim email pakai util sendMail (konfigurasi SMTP tetap dari email_settings/env)
    const result = await sendMail({
      to: email,
      subject: 'Kode OTP Reset Password - Lumbung Tani',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1a5276; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">Lumbung Tani</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Reset Password</p>
          </div>

          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e9ecef;">
            <h2 style="color: #1a5276; margin-top: 0;">Kode OTP Reset Password</h2>
            <p>Berikut adalah kode OTP untuk mereset password Anda:</p>

            <div style="background-color: white; border: 2px dashed #3498db; padding: 20px; margin: 25px 0; text-align: center; border-radius: 8px;">
              <span style="font-size: 32px; font-weight: bold; color: #2c3e50; letter-spacing: 4px; font-family: 'Courier New', monospace;">
                ${otpData.otp}
              </span>
            </div>

            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px 20px; margin: 20px 0;">
              <p style="margin: 0; color: #856404;">
                <strong>Berlaku sampai:</strong><br />
                ${new Date(otpData.expires_at).toLocaleString('id-ID')}
              </p>
            </div>

            <p style="color: #e74c3c; font-weight: bold;">
              Jangan berikan kode ini kepada siapa pun, termasuk pihak yang mengaku dari Lumbung Tani.
            </p>
          </div>

          <div style="margin-top: 20px; padding: 20px; background-color: #f8f9fa; border-radius: 8px; font-size: 0.9em; color: #6c757d;">
            <p style="margin: 0; text-align: center;">
              Email ini dikirim otomatis, mohon tidak membalas email ini.<br />
              © ${new Date().getFullYear()} Lumbung Tani. Semua hak dilindungi.
            </p>
          </div>
        </div>
      `
    });

    if (!result.success) {
      console.error('[TEST-OTP] Gagal kirim email:', result.error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengirim email OTP',
        error: result.error
      });
    }

    console.log('[TEST-OTP] Email terkirim, messageId:', result.messageId);

    return res.json({
      success: true,
      message: 'Email OTP berhasil dikirim',
      otp: otpData.otp,
      expires_at: otpData.expires_at,
      messageId: result.messageId
    });
  } catch (error) {
    console.error('[TEST-OTP] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengirim OTP',
      error: error.message
    });
  }
});

export default router;
