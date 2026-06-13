const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/profile', authenticate, (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      walletBalance: req.user.walletBalance,
      balance: req.user.balance
    }
  });
});

module.exports = router;
