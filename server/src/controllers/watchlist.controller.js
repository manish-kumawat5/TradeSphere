const prisma = require('../config/database');
const marketService = require('../services/market.service');

async function getWatchlist(req, res, next) {
  try {
    const userId = req.user.id;
    const items = await prisma.watchlist.findMany({
      where: { userId },
      select: { symbol: true }
    });

    // Fetch live quotes for each watchlist item
    const watchlistWithQuotes = await Promise.all(
      items.map(async (item) => {
        const quote = await marketService.getQuote(item.symbol);
        const metadata = marketService.getMetadata(item.symbol);
        return {
          symbol: item.symbol,
          name: metadata.name,
          price: quote.price,
          change: quote.change,
          changePercent: quote.changePercent
        };
      })
    );

    res.json({ success: true, data: watchlistWithQuotes });
  } catch (error) {
    next(error);
  }
}

async function addToWatchlist(req, res, next) {
  try {
    const userId = req.user.id;
    const { symbol } = req.body;

    if (!symbol) {
      return res.status(400).json({ success: false, message: 'Symbol is required' });
    }

    const upperSymbol = symbol.toUpperCase();

    // Check if already in watchlist
    const existing = await prisma.watchlist.findUnique({
      where: {
        userId_symbol: {
          userId,
          symbol: upperSymbol
        }
      }
    });

    if (existing) {
      return res.json({ success: true, message: 'Already in watchlist' });
    }

    await prisma.watchlist.create({
      data: {
        userId,
        symbol: upperSymbol
      }
    });

    res.status(201).json({ success: true, message: 'Added to watchlist' });
  } catch (error) {
    next(error);
  }
}

async function removeFromWatchlist(req, res, next) {
  try {
    const userId = req.user.id;
    const { symbol } = req.params;

    if (!symbol) {
      return res.status(400).json({ success: false, message: 'Symbol is required' });
    }

    const upperSymbol = symbol.toUpperCase();

    await prisma.watchlist.delete({
      where: {
        userId_symbol: {
          userId,
          symbol: upperSymbol
        }
      }
    });

    res.json({ success: true, message: 'Removed from watchlist' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist
};
