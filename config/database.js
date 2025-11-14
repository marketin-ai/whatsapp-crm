const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

let pool;

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'whatsapp_crm',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

const initialize = async () => {
  try {
    // Create connection pool
    pool = mysql.createPool(dbConfig);
    
    // Test connection
    const connection = await pool.getConnection();
    logger.info('Database connection established successfully');
    connection.release();
    
    // Create tables
    await createTables();
    
    return pool;
  } catch (error) {
    logger.error(`Database initialization failed: ${error.message}`);
    throw error;
  }
};

const createTables = async () => {
  const queries = [
    // Users table
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      full_name VARCHAR(100),
      role ENUM('admin', 'user') DEFAULT 'user',
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      last_login TIMESTAMP NULL,
      INDEX idx_email (email),
      INDEX idx_username (username)
    )`,
    
    // WhatsApp instances table
    `CREATE TABLE IF NOT EXISTS whatsapp_instances (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      instance_name VARCHAR(100) NOT NULL,
      phone_number VARCHAR(20),
      status ENUM('disconnected', 'connecting', 'connected', 'error') DEFAULT 'disconnected',
      qr_code TEXT,
      session_data TEXT,
      ai_enabled BOOLEAN DEFAULT true,
      auto_reply BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_id (user_id),
      INDEX idx_status (status)
    )`,
    
    // Contacts table
    `CREATE TABLE IF NOT EXISTS contacts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      instance_id INT NOT NULL,
      phone_number VARCHAR(20) NOT NULL,
      name VARCHAR(100),
      push_name VARCHAR(100),
      profile_pic_url TEXT,
      is_business BOOLEAN DEFAULT false,
      tags JSON,
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (instance_id) REFERENCES whatsapp_instances(id) ON DELETE CASCADE,
      UNIQUE KEY unique_contact (instance_id, phone_number),
      INDEX idx_instance_id (instance_id),
      INDEX idx_phone (phone_number)
    )`,
    
    // Messages table
    `CREATE TABLE IF NOT EXISTS messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      instance_id INT NOT NULL,
      contact_id INT NOT NULL,
      message_id VARCHAR(100) UNIQUE,
      type ENUM('text', 'image', 'video', 'audio', 'document', 'location') DEFAULT 'text',
      content TEXT,
      media_url TEXT,
      direction ENUM('incoming', 'outgoing') NOT NULL,
      is_ai_response BOOLEAN DEFAULT false,
      status ENUM('pending', 'sent', 'delivered', 'read', 'failed') DEFAULT 'pending',
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      metadata JSON,
      FOREIGN KEY (instance_id) REFERENCES whatsapp_instances(id) ON DELETE CASCADE,
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
      INDEX idx_instance_contact (instance_id, contact_id),
      INDEX idx_timestamp (timestamp),
      INDEX idx_direction (direction)
    )`,
    
    // AI conversations table
    `CREATE TABLE IF NOT EXISTS ai_conversations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      instance_id INT NOT NULL,
      contact_id INT NOT NULL,
      conversation_history JSON,
      context_summary TEXT,
      last_interaction TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (instance_id) REFERENCES whatsapp_instances(id) ON DELETE CASCADE,
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
      UNIQUE KEY unique_conversation (instance_id, contact_id),
      INDEX idx_last_interaction (last_interaction)
    )`,
    
    // AI settings table
    `CREATE TABLE IF NOT EXISTS ai_settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      api_provider ENUM('openai', 'anthropic', 'google', 'custom') DEFAULT 'openai',
      api_key VARCHAR(255),
      model VARCHAR(50) DEFAULT 'gpt-4',
      temperature DECIMAL(3,2) DEFAULT 0.7,
      max_tokens INT DEFAULT 500,
      system_prompt TEXT,
      custom_instructions TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY unique_user_settings (user_id)
    )`,
    
    // Audit logs table
    `CREATE TABLE IF NOT EXISTS audit_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      action VARCHAR(100) NOT NULL,
      entity_type VARCHAR(50),
      entity_id INT,
      ip_address VARCHAR(45),
      user_agent TEXT,
      details JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_user_action (user_id, action),
      INDEX idx_created_at (created_at)
    )`
  ];
  
  try {
    for (const query of queries) {
      await pool.execute(query);
    }
    logger.info('Database tables created successfully');
  } catch (error) {
    logger.error(`Failed to create tables: ${error.message}`);
    throw error;
  }
};

const query = async (sql, params = []) => {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    logger.error(`Query error: ${error.message}`);
    throw error;
  }
};

const close = async () => {
  if (pool) {
    await pool.end();
    logger.info('Database connection closed');
  }
};

module.exports = {
  initialize,
  query,
  close,
  getPool: () => pool
};
