const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  createAlert,
  getAlerts,
  deleteAlert,
} = require('../controllers/notifications.controller');

const router = express.Router();

router.get('/', authenticate, getNotifications);
router.get('/unread-count', authenticate, getUnreadCount);
router.put('/read-all', authenticate, markAllAsRead);
router.put('/:id/read', authenticate, markAsRead);
router.get('/alerts', authenticate, getAlerts);
router.post('/alerts', authenticate, createAlert);
router.delete('/alerts/:id', authenticate, deleteAlert);

module.exports = router;
