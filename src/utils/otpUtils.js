import crypto from 'crypto';

export function generateOTP(length = 6) {
  const digits = '0123456789';
  let OTP = '';
  for (let i = 0; i < length; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
}

export function generateOTPExpiry(minutes = 5) {
  const now = new Date();
  const expiry = new Date(now.getTime() + minutes * 60000);
  return expiry;
}

export function isOTPExpired(expiryTime) {
  return new Date() > expiryTime;
}

export function generateOTPHash(otp, secret = process.env.OTP_SECRET || 'default-otp-secret') {
  return crypto.createHmac('sha256', secret).update(otp).digest('hex');
}

export function verifyOTPHash(otp, hash, secret = process.env.OTP_SECRET || 'default-otp-secret') {
  const computedHash = crypto.createHmac('sha256', secret).update(otp).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(computedHash));
}
