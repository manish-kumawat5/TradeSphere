const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const prisma = require('../config/database');
const { generateTokenPair, verifyRefreshToken } = require('../config/jwt');
const { generateOTP, sendOtpEmail } = require('../services/email.service');

const resendOtpLimits = new Map();

// ── Cookie options ───────────────────────────────────────────────────
const accessCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 15 * 60 * 1000, // 15 minutes
  path: '/',
};

const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/api/auth/refresh',
};

// ── Helpers ──────────────────────────────────────────────────────────
function handleValidationErrors(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
    return true;
  }
  return false;
}

// ══════════════════════════════════════════════════════════════════════
//  POST /api/auth/register
// ══════════════════════════════════════════════════════════════════════
async function register(req, res, next) {
  try {
    if (handleValidationErrors(req, res)) return;

    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser && existingUser.isVerified) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Upsert user (update if unverified user exists, create if new)
    const user = await prisma.user.upsert({
      where: { email },
      update: { name, passwordHash },
      create: { name, email, passwordHash },
    });

    // Invalidate any existing OTPs for this email
    await prisma.otp.updateMany({
      where: { email, used: false },
      data: { used: true },
    });

    // Generate and save new OTP
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.otp.create({
      data: { email, otpCode, expiresAt },
    });

    // Send OTP email
    try {
      await sendOtpEmail(email, otpCode, name);
    } catch (emailError) {
      console.error('❌ Failed to send OTP email during registration:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again or contact support.',
      });
    }

    // In development, also log OTP to console
    if (process.env.NODE_ENV === 'development') {
      console.log(`\n🔑 OTP for ${email}: ${otpCode}\n`);
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email for the OTP.',
      data: {
        email: user.email,
        name: user.name,
        ...(process.env.NODE_ENV === 'development' && { otp: otpCode }),
      },
    });
  } catch (error) {
    next(error);
  }
}

// ══════════════════════════════════════════════════════════════════════
//  POST /api/auth/verify-otp
// ══════════════════════════════════════════════════════════════════════
async function verifyOtp(req, res, next) {
  // Existing verification for registration (unchanged)
  try {
    if (handleValidationErrors(req, res)) return;

    const { email, otp } = req.body;

    // Find valid OTP
    const otpRecord = await prisma.otp.findFirst({
      where: {
        email,
        otpCode: otp,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP. Please request a new one.',
      });
    }

    // Mark OTP as used
    await prisma.otp.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    // Mark user as verified
    const user = await prisma.user.update({
      where: { email },
      data: { isVerified: true },
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair(user);

    // Store refresh token hash
    const refreshHash = await bcrypt.hash(refreshToken, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: refreshHash },
    });

    // Set cookies
    res.cookie('accessToken', accessToken, accessCookieOptions);
    res.cookie('refreshToken', refreshToken, refreshCookieOptions);

    res.json({
      success: true,
      message: 'Email verified successfully! Welcome to TradeSphere.',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isVerified: true,
        },
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

// ══════════════════════════════════════════════════════════════════════
//  POST /api/auth/resend-otp
// ══════════════════════════════════════════════════════════════════════
async function resendOtp(req, res, next) {
  try {
    if (handleValidationErrors(req, res)) return;

    const { email } = req.body;

    // In-memory rate limiting: Max 3 resend attempts per email per 10 minutes
    const now = Date.now();
    const tenMinutesAgo = now - 10 * 60 * 1000;
    let attempts = resendOtpLimits.get(email) || [];
    attempts = attempts.filter((timestamp) => timestamp > tenMinutesAgo);

    if (attempts.length >= 3) {
      return res.status(429).json({
        success: false,
        message: 'Too many OTP requests. Please wait 10 minutes.',
      });
    }

    attempts.push(now);
    resendOtpLimits.set(email, attempts);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal whether user exists
      return res.json({
        success: true,
        message: 'If an account with this email exists, a new OTP has been sent.',
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'This email is already verified. Please log in.',
      });
    }

    // Rate limit: Check if an OTP was sent in the last 60 seconds
    const recentOtp = await prisma.otp.findFirst({
      where: {
        email,
        createdAt: { gt: new Date(Date.now() - 60 * 1000) },
      },
    });

    if (recentOtp) {
      return res.status(429).json({
        success: false,
        message: 'Please wait before requesting a new OTP.',
      });
    }

    // Invalidate old OTPs
    await prisma.otp.updateMany({
      where: { email, used: false },
      data: { used: true },
    });

    // Generate new OTP
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.otp.create({
      data: { email, otpCode, expiresAt },
    });

    try {
      await sendOtpEmail(email, otpCode, user.name);
    } catch (emailError) {
      console.error('❌ Failed to resend OTP email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again or contact support.',
      });
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`\n🔑 Resent OTP for ${email}: ${otpCode}\n`);
    }

    res.json({
      success: true,
      message: 'A new OTP has been sent to your email.',
      ...(process.env.NODE_ENV === 'development' && { otp: otpCode }),
    });
  } catch (error) {
    next(error);
  }
}

// ══════════════════════════════════════════════════════════════════════
//  POST /api/auth/login
// ══════════════════════════════════════════════════════════════════════
async function login(req, res, next) {
  try {
    if (handleValidationErrors(req, res)) return;

    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Check verified status
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in.',
        code: 'EMAIL_NOT_VERIFIED',
        email: user.email,
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokenPair(user);

    // Store refresh token hash
    const refreshHash = await bcrypt.hash(refreshToken, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: refreshHash },
    });

    // Set cookies
    res.cookie('accessToken', accessToken, accessCookieOptions);
    res.cookie('refreshToken', refreshToken, refreshCookieOptions);

    res.json({
      success: true,
      message: 'Login successful!',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isVerified: user.isVerified,
        },
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
}

// ══════════════════════════════════════════════════════════════════════
//  POST /api/auth/refresh
// ══════════════════════════════════════════════════════════════════════
async function refresh(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not found. Please log in again.',
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token. Please log in again.',
      });
    }

    // Find user and verify stored refresh token
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || !user.refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Session invalid. Please log in again.',
      });
    }

    // Compare token hashes (refresh token rotation)
    const isValidRefresh = await bcrypt.compare(token, user.refreshToken);
    if (!isValidRefresh) {
      // Potential token theft — invalidate all sessions
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: null },
      });
      return res.status(401).json({
        success: false,
        message: 'Session compromised. All sessions have been revoked.',
      });
    }

    // Rotate tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(user);

    const newRefreshHash = await bcrypt.hash(newRefreshToken, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshHash },
    });

    res.cookie('accessToken', accessToken, accessCookieOptions);
    res.cookie('refreshToken', newRefreshToken, refreshCookieOptions);

    res.json({
      success: true,
      message: 'Token refreshed successfully.',
      data: { accessToken },
    });
  } catch (error) {
    next(error);
  }
}

// ══════════════════════════════════════════════════════════════════════
//  POST /api/auth/logout
// ══════════════════════════════════════════════════════════════════════
async function logout(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;

    if (token) {
      try {
        const decoded = verifyRefreshToken(token);
        // Invalidate refresh token in database
        await prisma.user.update({
          where: { id: decoded.userId },
          data: { refreshToken: null },
        });
      } catch {
        // Token invalid, but still clear cookies
      }
    }

    // Clear cookies
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/api/auth/refresh' });

    res.json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
}

// ══════════════════════════════════════════════════════════════════════
//  POST /api/auth/forgot-password
// ══════════════════════════════════════════════════════════════════════
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.json({ success: true, message: 'If the account exists, an OTP has been sent.' });
    }

    await prisma.otp.updateMany({
      where: { email, used: false },
      data: { used: true },
    });

    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.otp.create({
      data: { email, otpCode, expiresAt },
    });

    try {
      await sendOtpEmail(email, otpCode, user.name);
    } catch (emailError) {
      console.error('Failed to send forgot-password OTP email:', emailError);
      return res.status(500).json({ success: false, message: 'Failed to send OTP email.' });
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`\n🔑 Forgot Password OTP for ${email}: ${otpCode}\n`);
    }

    res.json({ success: true, message: 'OTP sent to email successfully.' });
  } catch (err) {
    next(err);
  }
}

// ══════════════════════════════════════════════════════════════════════
//  POST /api/auth/reset-password
// ══════════════════════════════════════════════════════════════════════
async function resetPassword(req, res, next) {
  try {
    const { email, otp, newPassword } = req.body;

    const otpRecord = await prisma.otp.findFirst({
      where: {
        email,
        otpCode: otp,
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    }

    await prisma.otp.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { email },
      data: { passwordHash, refreshToken: null },
    });

    res.json({ success: true, message: 'Password reset successfully. Please log in.' });
  } catch (err) {
    next(err);
  }
}

// ══════════════════════════════════════════════════════════════════════
//  GET /api/auth/me
// ══════════════════════════════════════════════════════════════════════
async function getMe(req, res) {
  res.json({
    success: true,
    data: { user: req.user },
  });
}

module.exports = {
  forgotPassword,
  resetPassword,
  register,
  verifyOtp,
  resendOtp,
  login,
  refresh,
  logout,
  getMe,
};
