const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { getPnLReport } = require('../controllers/reports.controller');

const router = express.Router();

router.get('/pnl', authenticate, getPnLReport);

module.exports = router;
