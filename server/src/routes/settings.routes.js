const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const {
  getSettings,
  updateSettings,
  setup2FA,
  verify2FA,
  disable2FA,
} = require('../controllers/settings.controller');

const router = express.Router();

router.get('/', authenticate, getSettings);
router.put('/', authenticate, updateSettings);
router.post('/2fa/setup', authenticate, setup2FA);
router.post('/2fa/verify', authenticate, verify2FA);
router.delete('/2fa', authenticate, disable2FA);

module.exports = router;
