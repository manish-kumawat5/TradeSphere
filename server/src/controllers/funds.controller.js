const prisma = require('../config/database');
const { sendOtpEmail } = require('../services/email.service'); // placeholder email utility

/**
 * POST /api/funds/add
 * Body: { amount }
 */
async function addFunds(req, res, next) {
  try {
    const { amount } = req.body;
    // Validate: amount must be a number, > 0 and <= 1000000
    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0 || amount > 1000000) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount. Must be a number between 0 and 1,000,000.',
      });
    }
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { walletBalance: { increment: amount } },
    });
    return res.json({ success: true, newBalance: updatedUser.walletBalance });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/funds
 * Optional query params: category, riskLevel, search, page, limit
 */
async function listFunds(req, res, next) {
  try {
    const { category, riskLevel, search, page = 1, limit = 20 } = req.query;
    const where = {};
    if (category) where.category = category;
    if (riskLevel) where.riskLevel = riskLevel;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { fundManager: { contains: search, mode: 'insensitive' } },
      ];
    }
    const funds = await prisma.mutualFund.findMany({
      where,
      skip: (page - 1) * limit,
      take: Number(limit),
      orderBy: { name: 'asc' },
    });
    return res.json({ success: true, data: funds });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/funds/:id
 */
async function getFundDetail(req, res, next) {
  try {
    const { id } = req.params;
    const fund = await prisma.mutualFund.findUnique({ where: { id } });
    if (!fund) {
      return res.status(404).json({ success: false, message: 'Fund not found' });
    }
    return res.json({ success: true, data: fund });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/funds/:id/invest
 * Body: { amount: Number }
 */
async function investInFund(req, res, next) {
  try {
    const userId = req.user.id;
    const { id: fundId } = req.params;
    const { amount } = req.body;

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid investment amount' });
    }

    const [user, fund] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { walletBalance: true } }),
      prisma.mutualFund.findUnique({ where: { id: fundId } }),
    ]);

    if (!fund) {
      return res.status(404).json({ success: false, message: 'Fund not found' });
    }

    if (user.walletBalance < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
    }

    const units = amount / fund.nav;

    const transaction = await prisma.$transaction(async (tx) => {
      // Debit wallet
      await tx.user.update({
        where: { id: userId },
        data: { walletBalance: { decrement: amount } },
      });
      // Record fund transaction
      return tx.fundTransaction.create({
        data: {
          userId,
          fundId,
          type: 'BUY',
          amount,
          nav: fund.nav,
          units,
        },
      });
    });

    return res.json({ success: true, data: transaction });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/funds/:id/sip
 * Body: { monthlyAmount, startDate, endDate }
 */
async function setupSip(req, res, next) {
  try {
    const userId = req.user.id;
    const { id: fundId } = req.params;
    const { monthlyAmount, startDate, endDate } = req.body;

    if (typeof monthlyAmount !== 'number' || monthlyAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid monthly amount' });
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start) || isNaN(end) || start >= end) {
      return res.status(400).json({ success: false, message: 'Invalid start or end date' });
    }

    const fund = await prisma.mutualFund.findUnique({ where: { id: fundId } });
    if (!fund) {
      return res.status(404).json({ success: false, message: 'Fund not found' });
    }

    const sip = await prisma.sip.create({
      data: {
        userId,
        fundId,
        monthlyAmount,
        startDate: start,
        endDate: end,
        nextDeduction: start,
        isActive: true,
      },
    });

    // Simulated email notification (replace with real template as needed)
    try {
      await sendOtpEmail(req.user.email, 'SIP Created', req.user.name);
    } catch (_) {
      console.log('📧 SIP creation email simulated (NOP)');
    }

    return res.json({ success: true, data: sip });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  addFunds,
  listFunds,
  getFundDetail,
  investInFund,
  setupSip,
};