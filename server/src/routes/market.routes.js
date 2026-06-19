const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { getQuote, getHistory, search } = require('../controllers/market.controller');

const router = express.Router();

router.use(authenticate); // Secure all market endpoints

router.get('/quotes', async (req, res) => {
  const { symbols } = req.query;
  if (!symbols) {
    return res.status(400).json({ success: false, message: 'symbols query parameter is required' });
  }
  const symbolList = symbols.split(',').map(s => s.trim().toUpperCase());
  const quotes = {};
  // Use marketService to fetch each quote (real API with fallback)
  const marketService = require('../services/market.service');
  await Promise.all(symbolList.map(async (symbol) => {
    try {
      const quote = await marketService.getQuote(symbol);
      quotes[symbol] = quote;
    } catch (err) {
      console.error(`Failed to get quote for ${symbol}:`, err.message);
      // Fallback mock price
      quotes[symbol] = { price: 1000 + Math.random() * 4000 };
    }
  }));
  return res.json({ success: true, data: quotes });
});

router.get('/quote/:symbol', getQuote);
router.get('/history/:symbol', getHistory);
router.get('/search', search);

module.exports = router;
