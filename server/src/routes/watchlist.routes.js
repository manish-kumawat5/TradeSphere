const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { getWatchlist, addToWatchlist, removeFromWatchlist } = require('../controllers/watchlist.controller');

const router = express.Router();

router.use(authenticate);

router.get('/', getWatchlist);
router.post('/', addToWatchlist);
router.delete('/:symbol', removeFromWatchlist);

module.exports = router;
