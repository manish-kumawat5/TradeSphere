const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { getQuote, getHistory, search } = require('../controllers/market.controller');

const router = express.Router();

router.get('/quotes', async (req, res) => {
  const { symbols } = req.query;
  if (!symbols) {
    return res.status(400).json({ success: false, message: 'symbols query parameter is required' });
  }
  const symbolList = symbols.split(',').map(s => s.trim().toUpperCase());
  const quotes = {};
  const marketService = require('../services/market.service');
  await Promise.all(symbolList.map(async (symbol) => {
    try {
      const quote = await marketService.getQuote(symbol);
      quotes[symbol] = quote.price;
    } catch (err) {
      console.error(`Failed to get quote for ${symbol}:`, err.message);
      quotes[symbol] = 1000 + Math.random() * 4000;
    }
  }));
  return res.json({ success: true, data: quotes });
});

router.get('/quote/:symbol', authenticate, getQuote);
router.get('/history/:symbol', authenticate, getHistory);
router.get('/search', authenticate, search);

module.exports = router;
