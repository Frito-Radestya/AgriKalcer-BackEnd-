import nodemailer from 'nodemailer';
import fetch from 'node-fetch';
import db from '../db.js';
import crypto from 'crypto';

// Fungsi untuk mengenkripsi password SMTP
export function encrypt(text, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

// Fungsi untuk mendekripsi password SMTP
export function decrypt(encryptedText, key) {
  const textParts = encryptedText.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encrypted = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

export async function getEmailTransporter() {
  try {
    const { rows } = await db.query(
      'SELECT * FROM email_settings WHERE is_active = true ORDER BY created_at DESC LIMIT 1'
    );
    
    if (rows.length === 0) {
      // Fallback ke konfigurasi dari environment variables
      const host = process.env.SMTP_HOST
      const port = parseInt(process.env.SMTP_PORT || '587', 10)
      const secureEnv = process.env.SMTP_SECURE || 'false'
      const secure = String(secureEnv).toLowerCase() === 'true'
      const user = process.env.SMTP_USER
      const pass = process.env.SMTP_PASS

      if (!host || !user || !pass) {
        throw new Error('Tidak ada konfigurasi email aktif maupun konfigurasi SMTP di environment')
      }

      return nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
        tls: {
          rejectUnauthorized: false
        },
        connectionTimeout: 30000, // 30 seconds
        greetingTimeout: 10000, // 10 seconds
        socketTimeout: 10000 // 10 seconds
      })
    }

    const config = rows[0];
    const encryptionKey = process.env.ENCRYPTION_KEY || 'default-encryption-key-32-char-long';

    // Dekripsi password SMTP
    const decryptedPassword = decrypt(config.smtp_password, encryptionKey);

    return nodemailer.createTransport({
      host: config.smtp_host,
      port: config.smtp_port,
      secure: config.smtp_secure,
      auth: {
        user: config.smtp_user,
        pass: decryptedPassword
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 30000, // 30 seconds
      greetingTimeout: 10000, // 10 seconds
      socketTimeout: 10000 // 10 seconds
    });
  } catch (error) {
    console.error('Error membuat email transporter:', error);
    throw error;
  }
}

export async function sendMail({ to, subject, html, text }) {
  console.log('=== EMAIL SENDING DEBUG ===');
  console.log('To:', to);
  console.log('Subject:', subject);

  try {
    // Ambil from_email dan from_name dari DB kalau ada, fallback ke ENV
    const { rows } = await db.query(
      'SELECT from_email, from_name FROM email_settings WHERE is_active = true ORDER BY created_at DESC LIMIT 1'
    );

    let fromEmail;
    let fromName;

    if (rows.length === 0) {
      const envFrom = process.env.SMTP_FROM || process.env.BREVO_SENDER || '';
      if (envFrom.includes('<') && envFrom.includes('>')) {
        fromEmail = envFrom.substring(envFrom.indexOf('<') + 1, envFrom.indexOf('>'));
        fromName = envFrom.substring(0, envFrom.indexOf('<')).replace(/"/g, '').trim() || 'Lumbung Tani';
      } else {
        fromEmail = envFrom || process.env.SMTP_USER || process.env.BREVO_SENDER;
        fromName = process.env.BREVO_SENDER_NAME || 'Lumbung Tani';
      }
    } else {
      fromEmail = rows[0].from_email;
      fromName = rows[0].from_name;
    }

    console.log('From Email:', fromEmail);
    console.log('From Name:', fromName);

    const plainText = text || html.replace(/<[^>]*>?/gm, '');
    const recipients = Array.isArray(to) ? to : [to];

    // 1) Jika BREVO_API_KEY tersedia, kirim via Brevo HTTP API
    const brevoApiKey = process.env.BREVO_API_KEY;
    if (brevoApiKey) {
      console.log('Using Brevo HTTP API for email sending');

      const payload = {
        sender: {
          email: fromEmail,
          name: fromName
        },
        to: recipients.map((email) => ({ email })),
        subject,
        htmlContent: html,
        textContent: plainText
      };

      console.log('Brevo payload:', JSON.stringify(payload, null, 2));

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'api-key': brevoApiKey
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));
      console.log('Brevo API status:', response.status);
      console.log('Brevo API response:', data);

      if (!response.ok) {
        const message = data.message || data.error || `Brevo API error, status ${response.status}`;
        console.error('❌ Gagal mengirim email via Brevo API:', message);
        console.error('=== END EMAIL DEBUG ===');
        return { success: false, error: message };
      }

      const messageId = data.messageId || data['message-id'] || data.message || 'brevo-message';
      console.log('✅ Email terkirim via Brevo API:', messageId);
      console.log('=== END EMAIL DEBUG ===');
      return { success: true, messageId };
    }

    // 2) Fallback ke Nodemailer SMTP (untuk lokal / jika Brevo API tidak diset)
    console.log('BREVO_API_KEY tidak ditemukan, fallback ke Nodemailer SMTP');

    const transporter = await getEmailTransporter();
    console.log('Transporter created successfully');

    await transporter.verify();
    console.log('Transporter verified successfully');

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: recipients.join(', '),
      subject,
      text: plainText,
      html
    };

    console.log('Mail options (SMTP):', JSON.stringify(mailOptions, null, 2));

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email terkirim via SMTP:', info.messageId);
    console.log('Response:', info.response);
    console.log('=== END EMAIL DEBUG ===');
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Gagal mengirim email:', error);
    console.error('Error details:', error.message);
    console.error('Error code:', error.code);
    console.error('=== END EMAIL DEBUG ===');
    return { success: false, error: error.message };
  }
}

// Fungsi untuk mengirim email reset password
export async function sendNewPasswordEmail(email, newPassword) {
  return sendMail({
    to: email,
    subject: 'Password Baru Anda',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a5276;">Password Baru Anda</h2>
        <p>Berikut adalah password baru untuk akun Anda:</p>
        
        <div style="background-color: #f8f9fa; border-left: 4px solid #3498db; padding: 12px 20px; margin: 20px 0; font-family: monospace; font-size: 16px;">
          ${newPassword}
        </div>
        
        <p style="color: #e74c3c; font-weight: bold;">
          Harap segera ganti password ini setelah login ke akun Anda.
        </p>
        
        <p>Jika Anda tidak meminta reset password, segera hubungi tim dukungan kami.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 0.9em; color: #7f8c8d;">
          <p>Email ini dikirim otomatis, mohon tidak membalas email ini.</p>
          <p>© ${new Date().getFullYear()} Lumbung Tani. Semua hak dilindungi.</p>
        </div>
      </div>
    `
  });
}
