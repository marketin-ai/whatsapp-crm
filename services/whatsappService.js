const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');
const db = require('../config/database');
const AIService = require('./aiService');

class WhatsAppService {
  constructor(instanceId, userId, io) {
    this.instanceId = instanceId;
    this.userId = userId;
    this.io = io;
    this.client = null;
    this.isReady = false;
    this.aiService = new AIService(userId);
    
    // Ensure sessions directory exists
    const sessionsPath = process.env.WA_SESSION_PATH || './sessions';
    if (!fs.existsSync(sessionsPath)) {
      fs.mkdirSync(sessionsPath, { recursive: true });
    }
  }
  
  async initialize() {
    try {
      logger.info(`Initializing WhatsApp client for instance ${this.instanceId}`);
      
      const sessionPath = path.join(
        process.env.WA_SESSION_PATH || './sessions',
        `session-${this.instanceId}`
      );
      
      this.client = new Client({
        authStrategy: new LocalAuth({
          clientId: `instance-${this.instanceId}`,
          dataPath: sessionPath
        }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
          ]
        }
      });
      
      this.setupEventHandlers();
      await this.client.initialize();
      
    } catch (error) {
      logger.error(`WhatsApp initialization error: ${error.message}`);
      await this.updateStatus('error');
      throw error;
    }
  }
  
  setupEventHandlers() {
    // QR Code generation
    this.client.on('qr', async (qr) => {
      try {
        logger.info(`QR Code generated for instance ${this.instanceId}`);
        
        // Generate QR code as data URL
        const qrDataUrl = await qrcode.toDataURL(qr);
        
        // Save to database
        await db.query(
          'UPDATE whatsapp_instances SET qr_code = ?, status = ? WHERE id = ?',
          [qrDataUrl, 'connecting', this.instanceId]
        );
        
        // Emit via WebSocket
        this.io.to(`user-${this.userId}`).emit('qr-code', {
          instanceId: this.instanceId,
          qrCode: qrDataUrl
        });
        
      } catch (error) {
        logger.error(`QR code generation error: ${error.message}`);
      }
    });
    
    // Client ready
    this.client.on('ready', async () => {
      try {
        logger.info(`WhatsApp client ready for instance ${this.instanceId}`);
        this.isReady = true;
        
        const clientInfo = this.client.info;
        
        await db.query(
          'UPDATE whatsapp_instances SET status = ?, phone_number = ?, qr_code = NULL WHERE id = ?',
          ['connected', clientInfo.wid.user, this.instanceId]
        );
        
        this.io.to(`user-${this.userId}`).emit('instance-connected', {
          instanceId: this.instanceId,
          phoneNumber: clientInfo.wid.user
        });
        
      } catch (error) {
        logger.error(`Client ready error: ${error.message}`);
      }
    });
    
    // Authentication successful
    this.client.on('authenticated', () => {
      logger.info(`WhatsApp authenticated for instance ${this.instanceId}`);
    });
    
    // Authentication failure
    this.client.on('auth_failure', async (msg) => {
      logger.error(`WhatsApp authentication failed for instance ${this.instanceId}: ${msg}`);
      await this.updateStatus('error');
      
      this.io.to(`user-${this.userId}`).emit('instance-error', {
        instanceId: this.instanceId,
        error: 'Authentication failed'
      });
    });
    
    // Disconnected
    this.client.on('disconnected', async (reason) => {
      logger.info(`WhatsApp disconnected for instance ${this.instanceId}: ${reason}`);
      this.isReady = false;
      await this.updateStatus('disconnected');
      
      this.io.to(`user-${this.userId}`).emit('instance-disconnected', {
        instanceId: this.instanceId,
        reason
      });
    });
    
    // Incoming messages
    this.client.on('message', async (message) => {
      try {
        await this.handleIncomingMessage(message);
      } catch (error) {
        logger.error(`Message handling error: ${error.message}`);
      }
    });
    
    // Message acknowledgement
    this.client.on('message_ack', async (msg, ack) => {
      try {
        const status = this.getMessageStatus(ack);
        await db.query(
          'UPDATE messages SET status = ? WHERE message_id = ?',
          [status, msg.id.id]
        );
      } catch (error) {
        logger.error(`Message ack error: ${error.message}`);
      }
    });
  }
  
  async handleIncomingMessage(message) {
    try {
      if (message.fromMe) return; // Ignore own messages
      
      const contact = await message.getContact();
      const chat = await message.getChat();
      
      // Save or update contact
      const contactId = await this.saveContact(contact);
      
      // Save message
      await this.saveMessage(message, contactId, 'incoming');
      
      // Emit to frontend
      this.io.to(`user-${this.userId}`).emit('new-message', {
        instanceId: this.instanceId,
        message: {
          id: message.id.id,
          from: contact.number,
          name: contact.name || contact.pushname,
          body: message.body,
          type: message.type,
          timestamp: message.timestamp
        }
      });
      
      // Check if AI auto-reply is enabled
      const instances = await db.query(
        'SELECT ai_enabled, auto_reply FROM whatsapp_instances WHERE id = ?',
        [this.instanceId]
      );
      
      if (instances.length > 0 && instances[0].ai_enabled && instances[0].auto_reply) {
        await this.handleAIResponse(message, contactId, contact.number);
      }
      
    } catch (error) {
      logger.error(`Handle incoming message error: ${error.message}`);
    }
  }
  
  async handleAIResponse(message, contactId, phoneNumber) {
    try {
      // Get conversation history
      const history = await this.getConversationHistory(contactId);
      
      // Generate AI response
      const aiResponse = await this.aiService.generateResponse(
        message.body,
        history,
        this.instanceId
      );
      
      if (aiResponse) {
        // Send AI response
        await this.sendMessage(phoneNumber, aiResponse);
        
        // Save AI response message
        await db.query(
          'INSERT INTO messages (instance_id, contact_id, content, direction, is_ai_response, status) VALUES (?, ?, ?, ?, ?, ?)',
          [this.instanceId, contactId, aiResponse, 'outgoing', true, 'sent']
        );
        
        // Update conversation history
        await this.updateConversationHistory(contactId, message.body, aiResponse);
      }
      
    } catch (error) {
      logger.error(`AI response error: ${error.message}`);
    }
  }
  
  async saveContact(contact) {
    try {
      const contactData = {
        phone_number: contact.number,
        name: contact.name,
        push_name: contact.pushname,
        is_business: contact.isBusiness || false
      };
      
      // Check if contact exists
      const existing = await db.query(
        'SELECT id FROM contacts WHERE instance_id = ? AND phone_number = ?',
        [this.instanceId, contactData.phone_number]
      );
      
      if (existing.length > 0) {
        // Update existing contact
        await db.query(
          'UPDATE contacts SET name = ?, push_name = ?, is_business = ? WHERE id = ?',
          [contactData.name, contactData.push_name, contactData.is_business, existing[0].id]
        );
        return existing[0].id;
      } else {
        // Insert new contact
        const result = await db.query(
          'INSERT INTO contacts (instance_id, phone_number, name, push_name, is_business) VALUES (?, ?, ?, ?, ?)',
          [this.instanceId, contactData.phone_number, contactData.name, contactData.push_name, contactData.is_business]
        );
        return result.insertId;
      }
      
    } catch (error) {
      logger.error(`Save contact error: ${error.message}`);
      throw error;
    }
  }
  
  async saveMessage(message, contactId, direction) {
    try {
      await db.query(
        'INSERT INTO messages (instance_id, contact_id, message_id, type, content, direction, timestamp) VALUES (?, ?, ?, ?, ?, ?, FROM_UNIXTIME(?))',
        [this.instanceId, contactId, message.id.id, message.type, message.body, direction, message.timestamp]
      );
    } catch (error) {
      logger.error(`Save message error: ${error.message}`);
    }
  }
  
  async getConversationHistory(contactId, limit = 10) {
    try {
      const messages = await db.query(
        'SELECT content, direction, is_ai_response, timestamp FROM messages WHERE instance_id = ? AND contact_id = ? ORDER BY timestamp DESC LIMIT ?',
        [this.instanceId, contactId, limit]
      );
      
      return messages.reverse();
    } catch (error) {
      logger.error(`Get conversation history error: ${error.message}`);
      return [];
    }
  }
  
  async updateConversationHistory(contactId, userMessage, aiResponse) {
    try {
      const history = await this.getConversationHistory(contactId, 20);
      
      const conversationData = {
        messages: history,
        last_user_message: userMessage,
        last_ai_response: aiResponse
      };
      
      await db.query(
        'INSERT INTO ai_conversations (instance_id, contact_id, conversation_history) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE conversation_history = ?, last_interaction = NOW()',
        [this.instanceId, contactId, JSON.stringify(conversationData), JSON.stringify(conversationData)]
      );
      
    } catch (error) {
      logger.error(`Update conversation history error: ${error.message}`);
    }
  }
  
  async sendMessage(phone, message) {
    try {
      if (!this.isReady) {
        throw new Error('WhatsApp client is not ready');
      }
      
      const chatId = phone.includes('@c.us') ? phone : `${phone}@c.us`;
      const result = await this.client.sendMessage(chatId, message);
      
      logger.info(`Message sent from instance ${this.instanceId} to ${phone}`);
      
      return result;
      
    } catch (error) {
      logger.error(`Send message error: ${error.message}`);
      throw error;
    }
  }
  
  getMessageStatus(ack) {
    const statuses = {
      0: 'pending',
      1: 'sent',
      2: 'delivered',
      3: 'read',
      4: 'failed'
    };
    return statuses[ack] || 'pending';
  }
  
  async updateStatus(status) {
    try {
      await db.query(
        'UPDATE whatsapp_instances SET status = ? WHERE id = ?',
        [status, this.instanceId]
      );
    } catch (error) {
      logger.error(`Update status error: ${error.message}`);
    }
  }
  
  isConnected() {
    return this.isReady && this.client !== null;
  }
  
  async disconnect() {
    try {
      if (this.client) {
        await this.client.destroy();
        this.client = null;
        this.isReady = false;
        logger.info(`WhatsApp client disconnected for instance ${this.instanceId}`);
      }
    } catch (error) {
      logger.error(`Disconnect error: ${error.message}`);
    }
  }
}

module.exports = WhatsAppService;
