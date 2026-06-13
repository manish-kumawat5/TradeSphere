const marketService = require('../services/market.service');

async function getQuote(req, res, next) {
  try {
    const { symbol } = req.params;
    if (!symbol) {
      return res.status(400).json({ success: false, message: 'Symbol is required' });
    }
    const quote = await marketService.getQuote(symbol);
    const metadata = marketService.getMetadata(symbol);
    
    res.json({
      success: true,
      data: {
        ...quote,
        name: metadata.name,
        sector: metadata.sector,
        marketCap: metadata.marketCap,
        pe: metadata.pe,
        high52W: metadata.high52W,
        low52W: metadata.low52W
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getHistory(req, res, next) {
  try {
    const { symbol } = req.params;
    const { range } = req.query;
    if (!symbol) {
      return res.status(400).json({ success: false, message: 'Symbol is required' });
    }
    const history = await marketService.getHistory(symbol, range || '1D');
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    next(error);
  }
}

async function search(req, res, next) {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json({ success: true, data: [] });
    }
    const results = await marketService.searchSymbols(q);
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getQuote,
  getHistory,
  search
};
