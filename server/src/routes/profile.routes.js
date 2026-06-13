const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const {
  getProfile,
  updateProfile,
  submitKyc,
  getBankAccounts,
  addBankAccount,
  removeBankAccount,
  withdrawFunds,
  changePassword,
} = require('../controllers/profile.controller');

const router = express.Router();

router.get('/', authenticate, getProfile);
router.put('/', authenticate, updateProfile);
router.post('/kyc', authenticate, submitKyc);
router.get('/bank-accounts', authenticate, getBankAccounts);
router.post('/bank-accounts', authenticate, addBankAccount);
router.delete('/bank-accounts/:id', authenticate, removeBankAccount);
router.post('/withdraw', authenticate, withdrawFunds);
router.put('/password', authenticate, changePassword);

module.exports = router;
