const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');
const logger = require('../utils/logger');

// Get messages for an instance
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { instanceId, contactId, limit = 50, offset = 0 } = req.query;
    const userId = req.user.userId;
    
    if (!instanceId) {
      return res.status(400).json({
        success: false,
        message: 'Instance ID is required'
      });
    }
    
    // Verify instance belongs to user
    const instances = await db.query(
      'SELECT id FROM whatsapp_instances WHERE id = ? AND user_id = ?',
      [instanceId, userId]
    );
    
    if (instances.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Instance not found'
      });
    }
    
    let query = `
      SELECT m.*, c.phone_number, c.name, c.push_name 
      FROM messages m
      JOIN contacts c ON m.contact_id = c.id
      WHERE m.instance_id = ?
    `;
    const params = [instanceId];
    
    if (contactId) {
      query += ' AND m.contact_id = ?';
      params.push(contactId);
    }
    
    query += ' ORDER BY m.timestamp DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const messages = await db.query(query, params);
    
    res.json({
      success: true,
      messages: messages.reverse()
    });
    
  } catch (error) {
    logger.error(`Get messages error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
});

module.exports = router;
