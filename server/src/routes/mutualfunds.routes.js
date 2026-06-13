const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const {
  listFunds,
  getFundDetail,
  investInFund,
  createSip,
  listSips,
  cancelSip,
  getFundHoldings,
} = require('../controllers/mutualfunds.controller');

const router = express.Router();

router.get('/', listFunds);
router.get('/holdings', authenticate, getFundHoldings);
router.get('/sip', authenticate, listSips);
router.get('/:id', getFundDetail);
router.post('/invest', authenticate, investInFund);
router.post('/sip', authenticate, createSip);
router.delete('/sip/:id', authenticate, cancelSip);

module.exports = router;
