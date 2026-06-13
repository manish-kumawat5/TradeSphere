const prisma = require('../config/database');

// ── List all mutual funds with optional filters ──────────────────────
async function listFunds(req, res, next) {
  try {
    const { category, risk, sort, search } = req.query;

    const where = {};
    if (category && ['EQUITY', 'DEBT', 'HYBRID'].includes(category.toUpperCase())) {
      where.category = category.toUpperCase();
    }
    if (risk && ['LOW', 'MODERATE', 'HIGH'].includes(risk.toUpperCase())) {
      where.riskLevel = risk.toUpperCase();
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { fundHouse: { contains: search, mode: 'insensitive' } },
        { fundManager: { contains: search, mode: 'insensitive' } },
      ];
    }

    let orderBy = { return1Y: 'desc' };
    if (sort === 'nav') orderBy = { nav: 'desc' };
    if (sort === 'aum') orderBy = { aum: 'desc' };
    if (sort === 'expense') orderBy = { expenseRatio: 'asc' };
    if (sort === 'return1y') orderBy = { return1Y: 'desc' };
    if (sort === 'return3y') orderBy = { return3Y: 'desc' };
    if (sort === 'return5y') orderBy = { return5Y: 'desc' };
    if (sort === 'name') orderBy = { name: 'asc' };

    const funds = await prisma.mutualFund.findMany({ where, orderBy });

    res.json({ success: true, data: funds });
  } catch (error) {
    next(error);
  }
}

// ── Get single fund detail ───────────────────────────────────────────
async function getFundDetail(req, res, next) {
  try {
    const { id } = req.params;

    const fund = await prisma.mutualFund.findUnique({ where: { id } });
    if (!fund) {
      return res.status(404).json({ success: false, message: 'Fund not found' });
    }

    // Generate mock NAV history (1 year of daily NAV)
    const navHistory = [];
    let currentNav = fund.nav * 0.85;
    const now = Date.now();
    for (let i = 365; i >= 0; i--) {
      const date = new Date(now - i * 86400000);
      const change = (Math.random() - 0.48) * 0.008;
      currentNav = Math.max(1, currentNav * (1 + change));
      navHistory.push({
        date: date.toISOString().split('T')[0],
        nav: Number(currentNav.toFixed(2)),
      });
    }
    // Ensure last entry matches current NAV
    navHistory[navHistory.length - 1].nav = fund.nav;

    res.json({
      success: true,
      data: {
        ...fund,
        navHistory,
      },
    });
  } catch (error) {
    next(error);
  }
}

// ── One-time investment in a mutual fund ─────────────────────────────
async function investInFund(req, res, next) {
  try {
    const userId = req.user.id;
    const { fundId, amount } = req.body;

    if (!fundId || !amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Fund ID and positive amount are required' });
    }

    const fund = await prisma.mutualFund.findUnique({ where: { id: fundId } });
    if (!fund) {
      return res.status(404).json({ success: false, message: 'Fund not found' });
    }

    if (amount < fund.minInvestment) {
      return res.status(400).json({
        success: false,
        message: `Minimum investment is ₹${fund.minInvestment}`,
      });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user.walletBalance < amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available: ₹${user.walletBalance.toFixed(2)}`,
      });
    }

    const units = amount / fund.nav;

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { walletBalance: { decrement: amount } },
      });

      await tx.fundTransaction.create({
        data: {
          userId,
          fundId,
          type: 'BUY',
          amount,
          nav: fund.nav,
          units,
        },
      });

      // Create notification
      await tx.notification.create({
        data: {
          userId,
          type: 'ORDER_CONFIRMATION',
          title: 'Fund Investment Successful',
          message: `₹${amount.toLocaleString('en-IN')} invested in ${fund.name} at NAV ₹${fund.nav}. Units: ${units.toFixed(4)}`,
        },
      });
    });

    res.json({
      success: true,
      message: `Successfully invested ₹${amount} in ${fund.name}`,
      data: { fundId, amount, nav: fund.nav, units: Number(units.toFixed(4)) },
    });
  } catch (error) {
    next(error);
  }
}

// ── Create SIP ───────────────────────────────────────────────────────
async function createSip(req, res, next) {
  try {
    const userId = req.user.id;
    const { fundId, monthlyAmount, startDate, durationMonths } = req.body;

    if (!fundId || !monthlyAmount || !startDate || !durationMonths) {
      return res.status(400).json({ success: false, message: 'All SIP parameters are required' });
    }

    const fund = await prisma.mutualFund.findUnique({ where: { id: fundId } });
    if (!fund) {
      return res.status(404).json({ success: false, message: 'Fund not found' });
    }

    if (monthlyAmount < fund.minSipAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum SIP amount is ₹${fund.minSipAmount}`,
      });
    }

    const start = new Date(startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + parseInt(durationMonths, 10));

    const sip = await prisma.sip.create({
      data: {
        userId,
        fundId,
        monthlyAmount,
        startDate: start,
        endDate: end,
        nextDeduction: start,
      },
    });

    await prisma.notification.create({
      data: {
        userId,
        type: 'SIP_DEDUCTION',
        title: 'SIP Created',
        message: `SIP of ₹${monthlyAmount}/month created for ${fund.name}. Duration: ${durationMonths} months.`,
      },
    });

    res.status(201).json({
      success: true,
      message: `SIP created for ${fund.name}`,
      data: sip,
    });
  } catch (error) {
    next(error);
  }
}

// ── List user's SIPs ─────────────────────────────────────────────────
async function listSips(req, res, next) {
  try {
    const userId = req.user.id;

    const sips = await prisma.sip.findMany({
      where: { userId },
      include: { fund: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: sips });
  } catch (error) {
    next(error);
  }
}

// ── Cancel SIP ───────────────────────────────────────────────────────
async function cancelSip(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const sip = await prisma.sip.findUnique({ where: { id } });
    if (!sip || sip.userId !== userId) {
      return res.status(404).json({ success: false, message: 'SIP not found' });
    }

    await prisma.sip.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ success: true, message: 'SIP cancelled successfully' });
  } catch (error) {
    next(error);
  }
}

// ── Get user fund holdings ───────────────────────────────────────────
async function getFundHoldings(req, res, next) {
  try {
    const userId = req.user.id;

    const transactions = await prisma.fundTransaction.findMany({
      where: { userId },
      include: { fund: true },
      orderBy: { timestamp: 'desc' },
    });

    // Aggregate holdings by fund
    const holdingsMap = {};
    for (const tx of transactions) {
      if (!holdingsMap[tx.fundId]) {
        holdingsMap[tx.fundId] = {
          fund: tx.fund,
          totalUnits: 0,
          totalInvested: 0,
        };
      }
      if (tx.type === 'BUY') {
        holdingsMap[tx.fundId].totalUnits += tx.units;
        holdingsMap[tx.fundId].totalInvested += tx.amount;
      } else {
        holdingsMap[tx.fundId].totalUnits -= tx.units;
        holdingsMap[tx.fundId].totalInvested -= tx.amount;
      }
    }

    const holdings = Object.values(holdingsMap)
      .filter(h => h.totalUnits > 0.001)
      .map(h => ({
        ...h,
        currentValue: Number((h.totalUnits * h.fund.nav).toFixed(2)),
        pnl: Number((h.totalUnits * h.fund.nav - h.totalInvested).toFixed(2)),
        pnlPercent: h.totalInvested > 0
          ? Number((((h.totalUnits * h.fund.nav - h.totalInvested) / h.totalInvested) * 100).toFixed(2))
          : 0,
      }));

    res.json({ success: true, data: { holdings, transactions } });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listFunds,
  getFundDetail,
  investInFund,
  createSip,
  listSips,
  cancelSip,
  getFundHoldings,
};
