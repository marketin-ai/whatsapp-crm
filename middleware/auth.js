const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const db = require('../config/database');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is missing'
      });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            message: 'Token has expired'
          });
        }
        return res.status(403).json({
          success: false,
          message: 'Invalid token'
        });
      }
      
      // Verify user still exists and is active
      const users = await db.query(
        'SELECT id, username, email, role, is_active FROM users WHERE id = ?',
        [decoded.userId]
      );
      
      if (users.length === 0 || !users[0].is_active) {
        return res.status(403).json({
          success: false,
          message: 'User account is inactive or does not exist'
        });
      }
      
      req.user = {
        userId: decoded.userId,
        username: decoded.username,
        role: decoded.role
      };
      
      next();
    });
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    
    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRole
};
