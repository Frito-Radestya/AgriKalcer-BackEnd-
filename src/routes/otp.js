import express from 'express';
import { sendOTP, verifyOTP } from '../services/otpService.js';

const router = express.Router();

router.post('/send', async (req, res) => {
  try {
    const { email, purpose = 'verification' } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email diperlukan'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Format email tidak valid'
      });
    }

    const result = await sendOTP(email, purpose);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        expiryTime: result.expiryTime
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in /otp/send:', error);
    res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan server'
    });
  }
});

router.post('/verify', async (req, res) => {
  try {
    const { email, otp, purpose = 'verification' } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Email dan OTP diperlukan'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Format email tidak valid'
      });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        error: 'OTP harus 6 digit angka'
      });
    }

    const result = await verifyOTP(email, otp, purpose);

    if (result.success) {
      res.json({
        success: true,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in /otp/verify:', error);
    res.status(500).json({
      success: false,
      error: 'Terjadi kesalahan server'
    });
  }
});

export default router;
