import { sendMail } from '../utils/emailConfig.js';
import { generateOTP, generateOTPExpiry, generateOTPHash } from '../utils/otpUtils.js';
import db from '../db.js';

export async function sendOTP(email, purpose = 'verification') {
  try {
    const otp = generateOTP();
    const expiryTime = generateOTPExpiry(5);
    const otpHash = generateOTPHash(otp);

    await db.query(
      `INSERT INTO otp_codes (email, otp_hash, purpose, expires_at, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (email, purpose) 
       DO UPDATE SET 
         otp_hash = $2, 
         expires_at = $4, 
         created_at = NOW(),
         attempts = 0`,
      [email, otpHash, purpose, expiryTime]
    );

    const subject = purpose === 'verification' ? 'Kode Verifikasi Email Anda' : 'Kode OTP Anda';
    const html = generateOTPEmailTemplate(otp, purpose, expiryTime);

    const result = await sendMail({
      to: email,
      subject,
      html
    });

    if (result.success) {
      return { success: true, message: 'OTP berhasil dikirim', expiryTime };
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Error sending OTP:', error);
    return { success: false, error: error.message };
  }
}

export async function verifyOTP(email, otp, purpose = 'verification') {
  try {
    const { rows } = await db.query(
      `SELECT * FROM otp_codes 
       WHERE email = $1 AND purpose = $2 AND expires_at > NOW() 
       ORDER BY created_at DESC LIMIT 1`,
      [email, purpose]
    );

    if (rows.length === 0) {
      return { success: false, error: 'OTP tidak ditemukan atau sudah kadaluarsa' };
    }

    const otpRecord = rows[0];

    if (otpRecord.attempts >= 3) {
      await db.query(
        'UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1',
        [otpRecord.id]
      );
      return { success: false, error: 'Terlalu banyak percobaan. Silakan minta OTP baru.' };
    }

    const { verifyOTPHash } = await import('../utils/otpUtils.js');
    const isValid = verifyOTPHash(otp, otpRecord.otp_hash);

    if (!isValid) {
      await db.query(
        'UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1',
        [otpRecord.id]
      );
      return { success: false, error: 'OTP tidak valid' };
    }

    await db.query('DELETE FROM otp_codes WHERE id = $1', [otpRecord.id]);

    return { success: true, message: 'OTP berhasil diverifikasi' };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return { success: false, error: error.message };
  }
}

function generateOTPEmailTemplate(otp, purpose, expiryTime) {
  const purposeText = purpose === 'verification' ? 'verifikasi email' : 'autentikasi';
  const expiryMinutes = Math.ceil((expiryTime - new Date()) / 60000);

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #1a5276; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">Lumbung Tani</h1>
        <p style="margin: 5px 0 0 0; opacity: 0.9;">Kode ${purposeText === 'verification' ? 'Verifikasi' : 'OTP'}</p>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e9ecef;">
        <h2 style="color: #1a5276; margin-top: 0;">Kode ${purposeText === 'verification' ? 'Verifikasi' : 'OTP'} Anda</h2>
        
        <p>Berikut adalah kode ${purposeText} untuk akun Anda:</p>
        
        <div style="background-color: white; border: 2px dashed #3498db; padding: 20px; margin: 25px 0; text-align: center; border-radius: 8px;">
          <span style="font-size: 32px; font-weight: bold; color: #2c3e50; letter-spacing: 4px; font-family: 'Courier New', monospace;">
            ${otp}
          </span>
        </div>
        
        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px 20px; margin: 20px 0;">
          <p style="margin: 0; color: #856404;">
            <strong>Berlaku selama ${expiryMinutes} menit</strong><br>
            Kode ini akan kadaluarsa pada: ${expiryTime.toLocaleString('id-ID')}
          </p>
        </div>
        
        <p style="color: #e74c3c; font-weight: bold;">
          Jangan berikan kode ini kepada siapa pun, termasuk pihak yang mengaku dari Lumbung Tani.
        </p>
        
        <p>Jika Anda tidak meminta ${purposeText}, segera hubungi tim dukungan kami.</p>
      </div>
      
      <div style="margin-top: 20px; padding: 20px; background-color: #f8f9fa; border-radius: 8px; font-size: 0.9em; color: #6c757d;">
        <p style="margin: 0; text-align: center;">
          Email ini dikirim otomatis, mohon tidak membalas email ini.<br>
          © ${new Date().getFullYear()} Lumbung Tani. Semua hak dilindungi.
        </p>
      </div>
    </div>
  `;
}
