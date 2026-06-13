const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { getQuote, getHistory, search } = require('../controllers/market.controller');

const router = express.Router();

router.use(authenticate); // Secure all market endpoints

router.get('/quotes', (req, res) => {
  const { symbols } = req.query;
  if (!symbols) {
    return res.status(400).json({ success: false, message: 'symbols query parameter is required' });
  }
  const symbolList = symbols.split(',').map(s => s.trim().toUpperCase());
  const quotes = {};
  symbolList.forEach(symbol => {
    if (global.livePrices && global.livePrices[symbol] !== undefined) {
      quotes[symbol] = global.livePrices[symbol];
    } else {
      quotes[symbol] = 1000 + Math.random() * 4000;
    }
  });
  return res.json({ success: true, data: quotes });
});

router.get('/quote/:symbol', getQuote);
router.get('/history/:symbol', getHistory);
router.get('/search', search);

module.exports = router;
