const express = require('express');
const rateLimit = require('express-rate-limit');
const { authenticate } = require('../middleware/auth.middleware');
const {
  registerValidation,
  loginValidation,
  otpValidation,
  resendOtpValidation,
} = require('../middleware/validators');
const {
  register,
  verifyOtp,
  resendOtp,
  login,
  refresh,
  logout,
  getMe,
} = require('../controllers/auth.controller');

const router = express.Router();

// ── Rate Limiters ────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  message: { success: false, message: 'Too many attempts. Please try again in 15 minutes.' },
});

const otpLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3,
  message: { success: false, message: 'Too many OTP requests. Please wait a moment.' },
});

// ── Auth Routes ──────────────────────────────────────────────────────
router.post('/register', authLimiter, registerValidation, register);
router.post('/verify-otp', authLimiter, otpValidation, verifyOtp);
router.post('/resend-otp', otpLimiter, resendOtpValidation, resendOtp);
router.post('/login', authLimiter, loginValidation, login);
router.post('/forgot-password', authLimiter, async (req, res, next) => {
  const { email } = req.body;
  // Validate email presence
  if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
  try {
    const { forgotPassword } = require('../controllers/auth.controller');
    await forgotPassword(req, res);
  } catch (err) { next(err); }
});
router.post('/reset-password', authLimiter, async (req, res, next) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) return res.status(400).json({ success: false, message: 'Missing fields' });
  try {
    const { resetPassword } = require('../controllers/auth.controller');
    await resetPassword(req, res);
  } catch (err) { next(err); }
});
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);

module.exports = router;
