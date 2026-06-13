const prisma = require('../config/database');

// ── Get user settings ────────────────────────────────────────────────
async function getSettings(req, res, next) {
  try {
    let settings = await prisma.userSettings.findUnique({
      where: { userId: req.user.id },
    });

    if (!settings) {
      settings = await prisma.userSettings.create({
        data: { userId: req.user.id },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { twoFactorEnabled: true },
    });

    res.json({
      success: true,
      data: { ...settings, twoFactorEnabled: user.twoFactorEnabled },
    });
  } catch (error) {
    next(error);
  }
}

// ── Update settings ──────────────────────────────────────────────────
async function updateSettings(req, res, next) {
  try {
    const {
      theme,
      emailOnPriceAlert,
      emailOnOrderExecution,
      emailOnSipDeduction,
      emailOnFundCredit,
    } = req.body;

    const updateData = {};
    if (theme !== undefined) updateData.theme = theme;
    if (emailOnPriceAlert !== undefined) updateData.emailOnPriceAlert = emailOnPriceAlert;
    if (emailOnOrderExecution !== undefined) updateData.emailOnOrderExecution = emailOnOrderExecution;
    if (emailOnSipDeduction !== undefined) updateData.emailOnSipDeduction = emailOnSipDeduction;
    if (emailOnFundCredit !== undefined) updateData.emailOnFundCredit = emailOnFundCredit;

    const settings = await prisma.userSettings.upsert({
      where: { userId: req.user.id },
      update: updateData,
      create: { userId: req.user.id, ...updateData },
    });

    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
}

// ── Setup 2FA (simulated TOTP) ───────────────────────────────────────
async function setup2FA(req, res, next) {
  try {
    // Generate a simulated TOTP secret
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Store the secret temporarily
    await prisma.user.update({
      where: { id: req.user.id },
      data: { twoFactorSecret: secret },
    });

    // Generate otpauth URI for QR code
    const otpauthUrl = `otpauth://totp/TradeSphere:${req.user.email}?secret=${secret}&issuer=TradeSphere&algorithm=SHA1&digits=6&period=30`;

    res.json({
      success: true,
      data: {
        secret,
        otpauthUrl,
        // In a real app, we'd use the qrcode library here.
        // For simulation, we'll generate the QR on the client side.
      },
    });
  } catch (error) {
    next(error);
  }
}

// ── Verify and enable 2FA ────────────────────────────────────────────
async function verify2FA(req, res, next) {
  try {
    const { code } = req.body;

    if (!code || code.length !== 6) {
      return res.status(400).json({ success: false, message: 'Valid 6-digit code required' });
    }

    // Simulated verification — accept any 6-digit code
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user.twoFactorSecret) {
      return res.status(400).json({ success: false, message: 'Please setup 2FA first' });
    }

    await prisma.user.update({
      where: { id: req.user.id },
      data: { twoFactorEnabled: true },
    });

    res.json({ success: true, message: 'Two-factor authentication enabled' });
  } catch (error) {
    next(error);
  }
}

// ── Disable 2FA ──────────────────────────────────────────────────────
async function disable2FA(req, res, next) {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });
    res.json({ success: true, message: 'Two-factor authentication disabled' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSettings,
  updateSettings,
  setup2FA,
  verify2FA,
  disable2FA,
};
