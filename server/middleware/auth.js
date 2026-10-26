const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'shopeasy_development_super_secret_jwt_key_2026';

if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('development'))) {
  console.warn('⚠️ WARNING: Using default JWT_SECRET in production. Set a random JWT_SECRET in Render environment variables.');
}

// Required Authentication Middleware
const requireAuth = async (req, res, next) => {
  try {
    let token = null;

    // 1. Check HttpOnly cookie first
    if (req.cookies && req.cookies.token && req.cookies.token.trim()) {
      token = req.cookies.token.trim();
    }
    // 2. Check Authorization header as fallback (crucial for cross-origin third-party cookie restrictions)
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1]?.trim();
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in to continue.',
        error: 'NO_TOKEN',
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User session expired or user account no longer exists. Please log in again.',
        error: 'USER_NOT_FOUND',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    const isExpired = error.name === 'TokenExpiredError';
    return res.status(401).json({
      success: false,
      message: isExpired
        ? 'Your session has expired. Please log in again.'
        : 'Invalid authentication token. Please log in.',
      error: error.name,
    });
  }
};

module.exports = {
  requireAuth,
};
