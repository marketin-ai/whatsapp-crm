const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const logger = require('../utils/logger');
const { authenticateToken } = require('../middleware/auth');
const WhatsAppService = require('../services/whatsappService');

// Initialize WhatsApp instances on server start
const whatsappInstances = new Map();

// Create new WhatsApp instance
router.post('/instance', authenticateToken, [
  body('instance_name').trim().isLength({ min: 1, max: 100 }).withMessage('Instance name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { instance_name, ai_enabled = true, auto_reply = false } = req.body;
    const userId = req.user.userId;
    
    // Check instance limit
    const instances = await db.query(
      'SELECT COUNT(*) as count FROM whatsapp_instances WHERE user_id = ?',
      [userId]
    );
    
    const maxInstances = parseInt(process.env.WA_MAX_INSTANCES) || 10;
    if (instances[0].count >= maxInstances) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${maxInstances} instances allowed`
      });
    }
    
    // Create instance in database
    const result = await db.query(
      'INSERT INTO whatsapp_instances (user_id, instance_name, ai_enabled, auto_reply, status) VALUES (?, ?, ?, ?, ?)',
      [userId, instance_name, ai_enabled, auto_reply, 'disconnected']
    );
    
    const instanceId = result.insertId;
    
    logger.info(`WhatsApp instance created: ${instanceId} for user ${userId}`);
    
    res.status(201).json({
      success: true,
      message: 'Instance created successfully',
      instanceId
    });
    
  } catch (error) {
    logger.error(`Create instance error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to create instance'
    });
  }
});

// Initialize WhatsApp connection and get QR code
router.post('/instance/:instanceId/connect', authenticateToken, async (req, res) => {
  try {
    const { instanceId } = req.params;
    const userId = req.user.userId;
    
    // Verify instance belongs to user
    const instances = await db.query(
      'SELECT * FROM whatsapp_instances WHERE id = ? AND user_id = ?',
      [instanceId, userId]
    );
    
    if (instances.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Instance not found'
      });
    }
    
    const instance = instances[0];
    
    // Check if already connected
    if (whatsappInstances.has(instanceId)) {
      const service = whatsappInstances.get(instanceId);
      if (service.isConnected()) {
        return res.json({
          success: true,
          message: 'Already connected',
          status: 'connected'
        });
      }
    }
    
    // Update status
    await db.query(
      'UPDATE whatsapp_instances SET status = ? WHERE id = ?',
      ['connecting', instanceId]
    );
    
    // Initialize WhatsApp service
    const io = req.app.get('io');
    const whatsappService = new WhatsAppService(instanceId, userId, io);
    whatsappInstances.set(instanceId, whatsappService);
    
    // Initialize client
    await whatsappService.initialize();
    
    res.json({
      success: true,
      message: 'Connecting to WhatsApp. QR code will be sent via WebSocket.',
      status: 'connecting'
    });
    
  } catch (error) {
    logger.error(`Connect instance error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to connect instance'
    });
  }
});

// Disconnect WhatsApp instance
router.post('/instance/:instanceId/disconnect', authenticateToken, async (req, res) => {
  try {
    const { instanceId } = req.params;
    const userId = req.user.userId;
    
    // Verify instance belongs to user
    const instances = await db.query(
      'SELECT * FROM whatsapp_instances WHERE id = ? AND user_id = ?',
      [instanceId, userId]
    );
    
    if (instances.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Instance not found'
      });
    }
    
    // Disconnect if exists
    if (whatsappInstances.has(instanceId)) {
      const service = whatsappInstances.get(instanceId);
      await service.disconnect();
      whatsappInstances.delete(instanceId);
    }
    
    // Update status
    await db.query(
      'UPDATE whatsapp_instances SET status = ?, phone_number = NULL WHERE id = ?',
      ['disconnected', instanceId]
    );
    
    logger.info(`WhatsApp instance disconnected: ${instanceId}`);
    
    res.json({
      success: true,
      message: 'Instance disconnected successfully'
    });
    
  } catch (error) {
    logger.error(`Disconnect instance error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect instance'
    });
  }
});

// Get all user's WhatsApp instances
router.get('/instances', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const instances = await db.query(
      'SELECT id, instance_name, phone_number, status, ai_enabled, auto_reply, created_at FROM whatsapp_instances WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    
    res.json({
      success: true,
      instances
    });
    
  } catch (error) {
    logger.error(`Get instances error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch instances'
    });
  }
});

// Get instance details
router.get('/instance/:instanceId', authenticateToken, async (req, res) => {
  try {
    const { instanceId } = req.params;
    const userId = req.user.userId;
    
    const instances = await db.query(
      'SELECT * FROM whatsapp_instances WHERE id = ? AND user_id = ?',
      [instanceId, userId]
    );
    
    if (instances.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Instance not found'
      });
    }
    
    res.json({
      success: true,
      instance: instances[0]
    });
    
  } catch (error) {
    logger.error(`Get instance error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch instance'
    });
  }
});

// Update instance settings
router.patch('/instance/:instanceId', authenticateToken, async (req, res) => {
  try {
    const { instanceId } = req.params;
    const userId = req.user.userId;
    const { instance_name, ai_enabled, auto_reply } = req.body;
    
    // Verify instance belongs to user
    const instances = await db.query(
      'SELECT * FROM whatsapp_instances WHERE id = ? AND user_id = ?',
      [instanceId, userId]
    );
    
    if (instances.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Instance not found'
      });
    }
    
    // Build update query
    const updates = [];
    const values = [];
    
    if (instance_name !== undefined) {
      updates.push('instance_name = ?');
      values.push(instance_name);
    }
    if (ai_enabled !== undefined) {
      updates.push('ai_enabled = ?');
      values.push(ai_enabled);
    }
    if (auto_reply !== undefined) {
      updates.push('auto_reply = ?');
      values.push(auto_reply);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No updates provided'
      });
    }
    
    values.push(instanceId);
    
    await db.query(
      `UPDATE whatsapp_instances SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    logger.info(`WhatsApp instance updated: ${instanceId}`);
    
    res.json({
      success: true,
      message: 'Instance updated successfully'
    });
    
  } catch (error) {
    logger.error(`Update instance error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to update instance'
    });
  }
});

// Delete instance
router.delete('/instance/:instanceId', authenticateToken, async (req, res) => {
  try {
    const { instanceId } = req.params;
    const userId = req.user.userId;
    
    // Verify instance belongs to user
    const instances = await db.query(
      'SELECT * FROM whatsapp_instances WHERE id = ? AND user_id = ?',
      [instanceId, userId]
    );
    
    if (instances.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Instance not found'
      });
    }
    
    // Disconnect if connected
    if (whatsappInstances.has(instanceId)) {
      const service = whatsappInstances.get(instanceId);
      await service.disconnect();
      whatsappInstances.delete(instanceId);
    }
    
    // Delete from database
    await db.query('DELETE FROM whatsapp_instances WHERE id = ?', [instanceId]);
    
    logger.info(`WhatsApp instance deleted: ${instanceId}`);
    
    res.json({
      success: true,
      message: 'Instance deleted successfully'
    });
    
  } catch (error) {
    logger.error(`Delete instance error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to delete instance'
    });
  }
});

// Send message
router.post('/instance/:instanceId/send', authenticateToken, [
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('message').notEmpty().withMessage('Message is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { instanceId } = req.params;
    const userId = req.user.userId;
    const { phone, message } = req.body;
    
    // Verify instance belongs to user
    const instances = await db.query(
      'SELECT * FROM whatsapp_instances WHERE id = ? AND user_id = ?',
      [instanceId, userId]
    );
    
    if (instances.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Instance not found'
      });
    }
    
    // Check if connected
    if (!whatsappInstances.has(instanceId)) {
      return res.status(400).json({
        success: false,
        message: 'Instance not connected'
      });
    }
    
    const service = whatsappInstances.get(instanceId);
    const result = await service.sendMessage(phone, message);
    
    res.json({
      success: true,
      message: 'Message sent successfully',
      messageId: result.id.id
    });
    
  } catch (error) {
    logger.error(`Send message error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
});

module.exports = router;
