const prisma = require('../config/database');
const marketService = require('../services/market.service');

async function placeOrder(req, res, next) {
  try {
    const userId = req.user.id;
    const { symbol, type, orderType, quantity, price } = req.body;

    // Validate request
    if (!symbol || !type || !orderType || !quantity || !price) {
      return res.status(400).json({ success: false, message: 'All order parameters are required' });
    }

    if (quantity <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be greater than zero' });
    }

    if (price <= 0) {
      return res.status(400).json({ success: false, message: 'Price must be greater than zero' });
    }

    if (!['BUY', 'SELL'].includes(type.toUpperCase())) {
      return res.status(400).json({ success: false, message: 'Invalid transaction type (must be BUY or SELL)' });
    }

    const upperSymbol = symbol.toUpperCase();
    const qty = parseInt(quantity, 10);
    const orderPrice = parseFloat(price);
    const orderCost = qty * orderPrice;

    // Fetch user with fresh balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, walletBalance: true }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (type.toUpperCase() === 'BUY') {
      // Check balance
      if (user.walletBalance < orderCost) {
        return res.status(400).json({
          success: false,
          message: `Insufficient balance. Required: ₹${orderCost.toFixed(2)}, Available: ₹${user.walletBalance.toFixed(2)}`
        });
      }

      // Execute BUY
      await prisma.$transaction(async (tx) => {
        // Deduct balance
        await tx.user.update({
          where: { id: userId },
          data: { walletBalance: { decrement: orderCost } }
        });

        // Find existing portfolio entry
        const existing = await tx.portfolio.findUnique({
          where: {
            userId_symbol: {
              userId,
              symbol: upperSymbol
            }
          }
        });

        if (existing) {
          const newQty = existing.quantity + qty;
          const newAvgPrice = ((existing.quantity * existing.avgBuyPrice) + orderCost) / newQty;
          
          await tx.portfolio.update({
            where: { id: existing.id },
            data: {
              quantity: newQty,
              avgBuyPrice: Number(newAvgPrice.toFixed(2))
            }
          });
        } else {
          await tx.portfolio.create({
            data: {
              userId,
              symbol: upperSymbol,
              quantity: qty,
              avgBuyPrice: orderPrice
            }
          });
        }

        // Log transaction
        await tx.transaction.create({
          data: {
            userId,
            symbol: upperSymbol,
            type: 'BUY',
            quantity: qty,
            price: orderPrice
          }
        });
      });

      return res.json({
        success: true,
        message: `Successfully bought ${qty} shares of ${upperSymbol} at ₹${orderPrice.toFixed(2)}`,
        data: {
          symbol: upperSymbol,
          quantity: qty,
          price: orderPrice,
          total: orderCost
        }
      });
    } else {
      // Execute SELL
      const existing = await prisma.portfolio.findUnique({
        where: {
          userId_symbol: {
            userId,
            symbol: upperSymbol
          }
        }
      });

      if (!existing || existing.quantity < qty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient holdings. Owned: ${existing ? existing.quantity : 0}, Requested: ${qty}`
        });
      }

      const orderProceeds = qty * orderPrice;

      await prisma.$transaction(async (tx) => {
        // Add balance
        await tx.user.update({
          where: { id: userId },
          data: { walletBalance: { increment: orderProceeds } }
        });

        if (existing.quantity === qty) {
          // Remove from portfolio entirely
          await tx.portfolio.delete({
            where: { id: existing.id }
          });
        } else {
          // Decrease quantity
          await tx.portfolio.update({
            where: { id: existing.id },
            data: {
              quantity: existing.quantity - qty
            }
          });
        }

        // Log transaction
        await tx.transaction.create({
          data: {
            userId,
            symbol: upperSymbol,
            type: 'SELL',
            quantity: qty,
            price: orderPrice
          }
        });
      });

      return res.json({
        success: true,
        message: `Successfully sold ${qty} shares of ${upperSymbol} at ₹${orderPrice.toFixed(2)}`,
        data: {
          symbol: upperSymbol,
          quantity: qty,
          price: orderPrice,
          total: orderProceeds
        }
      });
    }
  } catch (error) {
    next(error);
  }
}

async function getPortfolio(req, res, next) {
  try {
    const userId = req.user.id;
    
    // Fetch fresh user balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true }
    });

    const holdings = await prisma.portfolio.findMany({
      where: { userId },
      orderBy: { symbol: 'asc' }
    });

    let totalInvested = 0;
    let totalCurrentValue = 0;

    const enrichedHoldings = await Promise.all(
      holdings.map(async (h) => {
        const quote = await marketService.getQuote(h.symbol);
        const metadata = marketService.getMetadata(h.symbol);
        
        const investedValue = h.quantity * h.avgBuyPrice;
        const currentValue = h.quantity * quote.price;
        const pnl = currentValue - investedValue;
        const pnlPercent = investedValue > 0 ? (pnl / investedValue) * 100 : 0;
        
        totalInvested += investedValue;
        totalCurrentValue += currentValue;

        return {
          id: h.id,
          symbol: h.symbol,
          name: metadata.name,
          quantity: h.quantity,
          avgBuyPrice: h.avgBuyPrice,
          ltp: quote.price,
          dayChange: quote.change,
          dayChangePercent: quote.changePercent,
          investedValue: Number(investedValue.toFixed(2)),
          currentValue: Number(currentValue.toFixed(2)),
          pnl: Number(pnl.toFixed(2)),
          pnlPercent: Number(pnlPercent.toFixed(2)),
          up: pnl >= 0
        };
      })
    );

    const totalPnL = totalCurrentValue - totalInvested;
    const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

    res.json({
      success: true,
      data: {
        holdings: enrichedHoldings,
        summary: {
          balance: Number(user.walletBalance.toFixed(2)),
          totalInvested: Number(totalInvested.toFixed(2)),
          currentValue: Number(totalCurrentValue.toFixed(2)),
          totalPnL: Number(totalPnL.toFixed(2)),
          totalPnLPercent: Number(totalPnLPercent.toFixed(2)),
          up: totalPnL >= 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getTransactions(req, res, next) {
  try {
    const userId = req.user.id;
    const { symbol, type } = req.query;

    const whereClause = { userId };
    if (symbol) {
      whereClause.symbol = symbol.toUpperCase();
    }
    if (type && ['BUY', 'SELL'].includes(type.toUpperCase())) {
      whereClause.type = type.toUpperCase();
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' }
    });

    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  placeOrder,
  getPortfolio,
  getTransactions
};
