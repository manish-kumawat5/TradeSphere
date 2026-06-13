const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { placeOrder, getPortfolio, getTransactions } = require('../controllers/order.controller');

const router = express.Router();

router.use(authenticate);

router.post('/place', placeOrder);
router.get('/portfolio', getPortfolio);
router.get('/transactions', getTransactions);

module.exports = router;
