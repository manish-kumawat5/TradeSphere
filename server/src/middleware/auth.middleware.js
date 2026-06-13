const { verifyAccessToken } = require('../config/jwt');
const prisma = require('../config/database');

/**
 * Authentication middleware — verifies JWT from httpOnly cookie or Authorization header
 */
async function authenticate(req, res, next) {
  try {
    let token = null;

    // Check httpOnly cookie first
    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    // Fallback to Authorization header
    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.',
      });
    }

    const decoded = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        isVerified: true,
        panNumber: true,
        walletBalance: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Please log in again.',
      });
    }

    user.balance = user.walletBalance;
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please refresh your session.',
        code: 'TOKEN_EXPIRED',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid token. Please log in again.',
    });
  }
}

module.exports = { authenticate };
