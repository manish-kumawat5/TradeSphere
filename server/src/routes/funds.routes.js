const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const {
  listFunds,
  getFundDetail,
  investInFund,
  setupSip,
} = require('../controllers/funds.controller');

const router = express.Router();

// All fund routes require authentication
router.use(authenticate);

/**
 * GET /api/funds
 * Query params: category (EQUITY|DEBT|HYBRID), riskLevel, search, page, limit
 */
router.get('/', listFunds);

/**
 * GET /api/funds/:id
 */
router.get('/:id', getFundDetail);

/**
 * POST /api/funds/:id/invest
 * Body: { amount: Number }
 */
router.post('/:id/invest', investInFund);

/**
 * POST /api/funds/:id/sip
 * Body: { monthlyAmount, startDate, endDate, frequency }
 */
router.post('/:id/sip', setupSip);

// Existing routes above
router.post('/add', authenticate, require('../controllers/funds.controller').addFunds);
module.exports = router;
