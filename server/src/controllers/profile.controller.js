const prisma = require('../config/database');
const bcrypt = require('bcryptjs');

// ── Get full profile ─────────────────────────────────────────────────
async function getProfile(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        dob: true,
        panNumber: true,
        aadhaarLast4: true,
        kycDocFilename: true,
        kycStatus: true,
        walletBalance: true,
        twoFactorEnabled: true,
        createdAt: true,
      },
    });

    const bankAccounts = await prisma.bankAccount.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: { ...user, bankAccounts } });
  } catch (error) {
    next(error);
  }
}

// ── Update personal info ─────────────────────────────────────────────
async function updateProfile(req, res, next) {
  try {
    const { name, phone, dob } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (dob !== undefined) updateData.dob = dob ? new Date(dob) : null;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true, name: true, email: true, phone: true, dob: true,
        kycStatus: true, walletBalance: true,
      },
    });

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

// ── Submit KYC ───────────────────────────────────────────────────────
async function submitKyc(req, res, next) {
  try {
    const { panNumber, aadhaarLast4, docFilename } = req.body;

    if (!panNumber || !aadhaarLast4) {
      return res.status(400).json({ success: false, message: 'PAN and Aadhaar last 4 digits are required' });
    }

    // Validate PAN format: ABCDE1234F
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber.toUpperCase())) {
      return res.status(400).json({ success: false, message: 'Invalid PAN format' });
    }

    // Validate Aadhaar last 4 digits
    if (!/^\d{4}$/.test(aadhaarLast4)) {
      return res.status(400).json({ success: false, message: 'Aadhaar must be exactly 4 digits' });
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        panNumber: panNumber.toUpperCase(),
        aadhaarLast4,
        kycDocFilename: docFilename || null,
        kycStatus: 'VERIFIED',
      },
    });

    await prisma.notification.create({
      data: {
        userId: req.user.id,
        type: 'KYC_UPDATE',
        title: 'KYC Verified',
        message: 'Your KYC has been successfully verified. You can now invest in mutual funds.',
      },
    });

    res.json({
      success: true,
      message: 'KYC submitted and verified successfully',
      data: { kycStatus: user.kycStatus },
    });
  } catch (error) {
    next(error);
  }
}

// ── Bank Accounts ────────────────────────────────────────────────────
async function getBankAccounts(req, res, next) {
  try {
    const accounts = await prisma.bankAccount.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: accounts });
  } catch (error) {
    next(error);
  }
}

async function addBankAccount(req, res, next) {
  try {
    const { accountNo, ifsc, bankName } = req.body;

    if (!accountNo || !ifsc || !bankName) {
      return res.status(400).json({ success: false, message: 'Account number, IFSC, and bank name are required' });
    }

    const count = await prisma.bankAccount.count({ where: { userId: req.user.id } });

    const account = await prisma.bankAccount.create({
      data: {
        userId: req.user.id,
        accountNo,
        ifsc: ifsc.toUpperCase(),
        bankName,
        isPrimary: count === 0, // First account is primary
      },
    });

    res.status(201).json({ success: true, data: account });
  } catch (error) {
    next(error);
  }
}

async function removeBankAccount(req, res, next) {
  try {
    const { id } = req.params;
    const account = await prisma.bankAccount.findUnique({ where: { id } });
    if (!account || account.userId !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Bank account not found' });
    }
    await prisma.bankAccount.delete({ where: { id } });
    res.json({ success: true, message: 'Bank account removed' });
  } catch (error) {
    next(error);
  }
}

// ── Withdraw Funds ───────────────────────────────────────────────────
async function withdrawFunds(req, res, next) {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid withdrawal amount' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (user.walletBalance < amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available: ₹${user.walletBalance.toFixed(2)}`,
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { walletBalance: { decrement: amount } },
    });

    await prisma.notification.create({
      data: {
        userId: req.user.id,
        type: 'FUND_WITHDRAWAL',
        title: 'Withdrawal Successful',
        message: `₹${amount.toLocaleString('en-IN')} has been withdrawn from your wallet.`,
      },
    });

    res.json({
      success: true,
      message: `₹${amount} withdrawn successfully`,
      newBalance: updatedUser.walletBalance,
    });
  } catch (error) {
    next(error);
  }
}

// ── Change Password ──────────────────────────────────────────────────
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new passwords are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash },
    });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProfile,
  updateProfile,
  submitKyc,
  getBankAccounts,
  addBankAccount,
  removeBankAccount,
  withdrawFunds,
  changePassword,
};
