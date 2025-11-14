const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/database');
const logger = require('../utils/logger');

// Get contacts for an instance
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { instanceId } = req.query;
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
    
    const contacts = await db.query(
      'SELECT * FROM contacts WHERE instance_id = ? ORDER BY updated_at DESC',
      [instanceId]
    );
    
    res.json({
      success: true,
      contacts
    });
    
  } catch (error) {
    logger.error(`Get contacts error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contacts'
    });
  }
});

// Update contact notes/tags
router.patch('/:contactId', authenticateToken, async (req, res) => {
  try {
    const { contactId } = req.params;
    const { notes, tags } = req.body;
    const userId = req.user.userId;
    
    // Verify contact belongs to user's instance
    const contacts = await db.query(
      'SELECT c.* FROM contacts c JOIN whatsapp_instances wi ON c.instance_id = wi.id WHERE c.id = ? AND wi.user_id = ?',
      [contactId, userId]
    );
    
    if (contacts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }
    
    const updates = [];
    const values = [];
    
    if (notes !== undefined) {
      updates.push('notes = ?');
      values.push(notes);
    }
    if (tags !== undefined) {
      updates.push('tags = ?');
      values.push(JSON.stringify(tags));
    }
    
    if (updates.length > 0) {
      values.push(contactId);
      await db.query(
        `UPDATE contacts SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }
    
    res.json({
      success: true,
      message: 'Contact updated successfully'
    });
    
  } catch (error) {
    logger.error(`Update contact error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to update contact'
    });
  }
});

module.exports = router;
