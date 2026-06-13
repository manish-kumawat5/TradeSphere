const prisma = require('../config/database');

// ── Get all notifications ────────────────────────────────────────────
async function getNotifications(req, res, next) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
}

// ── Get unread count ─────────────────────────────────────────────────
async function getUnreadCount(req, res, next) {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false },
    });
    res.json({ success: true, data: { count } });
  } catch (error) {
    next(error);
  }
}

// ── Mark as read ─────────────────────────────────────────────────────
async function markAsRead(req, res, next) {
  try {
    const { id } = req.params;
    await prisma.notification.updateMany({
      where: { id, userId: req.user.id },
      data: { isRead: true },
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

// ── Mark all as read ─────────────────────────────────────────────────
async function markAllAsRead(req, res, next) {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

// ── Create price alert ───────────────────────────────────────────────
async function createAlert(req, res, next) {
  try {
    const { symbol, targetPrice, condition } = req.body;

    if (!symbol || !targetPrice || !condition) {
      return res.status(400).json({ success: false, message: 'Symbol, target price, and condition are required' });
    }

    if (!['ABOVE', 'BELOW'].includes(condition.toUpperCase())) {
      return res.status(400).json({ success: false, message: 'Condition must be ABOVE or BELOW' });
    }

    const alert = await prisma.priceAlert.create({
      data: {
        userId: req.user.id,
        symbol: symbol.toUpperCase(),
        targetPrice: parseFloat(targetPrice),
        condition: condition.toUpperCase(),
      },
    });

    res.status(201).json({ success: true, data: alert });
  } catch (error) {
    next(error);
  }
}

// ── List alerts ──────────────────────────────────────────────────────
async function getAlerts(req, res, next) {
  try {
    const alerts = await prisma.priceAlert.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: alerts });
  } catch (error) {
    next(error);
  }
}

// ── Delete alert ─────────────────────────────────────────────────────
async function deleteAlert(req, res, next) {
  try {
    const { id } = req.params;
    const alert = await prisma.priceAlert.findUnique({ where: { id } });
    if (!alert || alert.userId !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }
    await prisma.priceAlert.delete({ where: { id } });
    res.json({ success: true, message: 'Alert deleted' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  createAlert,
  getAlerts,
  deleteAlert,
};
