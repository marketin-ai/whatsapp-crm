const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const db = require('../config/database');
const logger = require('../utils/logger');

// Get all users (admin only)
router.get('/', authenticateToken, authorizeRole('admin'), async (req, res) => {
  try {
    const users = await db.query(
      'SELECT id, username, email, full_name, role, is_active, created_at, last_login FROM users ORDER BY created_at DESC'
    );
    
    res.json({
      success: true,
      users
    });
    
  } catch (error) {
    logger.error(`Get users error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

module.exports = router;
