const prisma = require('../config/database');
const marketService = require('../services/market.service');

// ── P&L Report ───────────────────────────────────────────────────────
async function getPnLReport(req, res, next) {
  try {
    const userId = req.user.id;
    const { fy } = req.query; // e.g., "2025-26"

    // Determine financial year date range
    let startDate, endDate;
    if (fy) {
      const [startYear] = fy.split('-');
      startDate = new Date(`${startYear}-04-01T00:00:00Z`);
      endDate = new Date(`${parseInt(startYear) + 1}-03-31T23:59:59Z`);
    } else {
      // Default current FY
      const now = new Date();
      const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
      startDate = new Date(`${year}-04-01T00:00:00Z`);
      endDate = new Date(`${year + 1}-03-31T23:59:59Z`);
    }

    // Get all transactions in the FY
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        timestamp: { gte: startDate, lte: endDate },
      },
      orderBy: { timestamp: 'asc' },
    });

    // Get all transactions ever (for cost basis)
    const allTransactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { timestamp: 'asc' },
    });

    // Calculate realized P&L from sells in this FY
    const realizedBySymbol = {};
    const costBasis = {}; // FIFO tracking

    // Build FIFO queues from all BUY transactions
    for (const tx of allTransactions) {
      if (tx.type === 'BUY') {
        if (!costBasis[tx.symbol]) costBasis[tx.symbol] = [];
        costBasis[tx.symbol].push({ quantity: tx.quantity, price: tx.price, date: tx.timestamp });
      }
    }

    // Process SELL transactions to calculate realized P&L
    const fifoQueues = {};
    for (const tx of allTransactions) {
      if (tx.type === 'BUY') {
        if (!fifoQueues[tx.symbol]) fifoQueues[tx.symbol] = [];
        fifoQueues[tx.symbol].push({ qty: tx.quantity, price: tx.price, date: tx.timestamp });
      } else if (tx.type === 'SELL') {
        const isInFY = tx.timestamp >= startDate && tx.timestamp <= endDate;
        let remainingSell = tx.quantity;
        let costForSell = 0;
        const queue = fifoQueues[tx.symbol] || [];

        while (remainingSell > 0 && queue.length > 0) {
          const oldest = queue[0];
          const matched = Math.min(remainingSell, oldest.qty);
          costForSell += matched * oldest.price;
          oldest.qty -= matched;
          remainingSell -= matched;
          if (oldest.qty <= 0) queue.shift();
        }

        if (isInFY) {
          const proceeds = tx.quantity * tx.price;
          const pnl = proceeds - costForSell;
          const holdingDays = costBasis[tx.symbol]?.[0]
            ? (tx.timestamp - costBasis[tx.symbol][0].date) / 86400000
            : 365;

          if (!realizedBySymbol[tx.symbol]) {
            realizedBySymbol[tx.symbol] = {
              symbol: tx.symbol,
              totalProceeds: 0,
              totalCost: 0,
              totalPnL: 0,
              sellQuantity: 0,
              isLongTerm: holdingDays > 365,
            };
          }
          realizedBySymbol[tx.symbol].totalProceeds += proceeds;
          realizedBySymbol[tx.symbol].totalCost += costForSell;
          realizedBySymbol[tx.symbol].totalPnL += pnl;
          realizedBySymbol[tx.symbol].sellQuantity += tx.quantity;
        }
      }
    }

    const realizedPnL = Object.values(realizedBySymbol).map(r => ({
      ...r,
      totalProceeds: Number(r.totalProceeds.toFixed(2)),
      totalCost: Number(r.totalCost.toFixed(2)),
      totalPnL: Number(r.totalPnL.toFixed(2)),
    }));

    // Unrealized P&L (current holdings)
    const holdings = await prisma.portfolio.findMany({ where: { userId } });
    const unrealizedPnL = await Promise.all(
      holdings.map(async (h) => {
        const quote = await marketService.getQuote(h.symbol);
        const invested = h.quantity * h.avgBuyPrice;
        const currentVal = h.quantity * quote.price;
        const pnl = currentVal - invested;
        return {
          symbol: h.symbol,
          quantity: h.quantity,
          avgBuyPrice: h.avgBuyPrice,
          currentPrice: quote.price,
          investedValue: Number(invested.toFixed(2)),
          currentValue: Number(currentVal.toFixed(2)),
          pnl: Number(pnl.toFixed(2)),
          pnlPercent: invested > 0 ? Number(((pnl / invested) * 100).toFixed(2)) : 0,
        };
      })
    );

    // Tax summary
    const totalRealizedPnL = realizedPnL.reduce((sum, r) => sum + r.totalPnL, 0);
    const stcgItems = realizedPnL.filter(r => !r.isLongTerm);
    const ltcgItems = realizedPnL.filter(r => r.isLongTerm);
    const stcg = stcgItems.reduce((sum, r) => sum + Math.max(0, r.totalPnL), 0);
    const ltcg = ltcgItems.reduce((sum, r) => sum + Math.max(0, r.totalPnL), 0);

    // STCG tax: 15%, LTCG tax: 10% (above ₹1 lakh exemption)
    const stcgTax = Number((stcg * 0.15).toFixed(2));
    const ltcgTaxable = Math.max(0, ltcg - 100000);
    const ltcgTax = Number((ltcgTaxable * 0.10).toFixed(2));

    res.json({
      success: true,
      data: {
        financialYear: fy || `${startDate.getFullYear()}-${(startDate.getFullYear() + 1).toString().slice(-2)}`,
        realized: realizedPnL,
        unrealized: unrealizedPnL,
        summary: {
          totalRealizedPnL: Number(totalRealizedPnL.toFixed(2)),
          totalUnrealizedPnL: Number(unrealizedPnL.reduce((s, u) => s + u.pnl, 0).toFixed(2)),
          stcg: Number(stcg.toFixed(2)),
          ltcg: Number(ltcg.toFixed(2)),
          stcgTax,
          ltcgTax,
          totalTax: Number((stcgTax + ltcgTax).toFixed(2)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getPnLReport };
