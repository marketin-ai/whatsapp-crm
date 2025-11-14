const axios = require('axios');
const logger = require('../utils/logger');
const db = require('../config/database');

class AIService {
  constructor(userId) {
    this.userId = userId;
    this.settings = null;
  }
  
  async loadSettings() {
    try {
      const settings = await db.query(
        'SELECT * FROM ai_settings WHERE user_id = ?',
        [this.userId]
      );
      
      if (settings.length > 0) {
        this.settings = settings[0];
      } else {
        // Use default settings
        this.settings = {
          api_provider: 'openai',
          api_key: process.env.AI_API_KEY,
          model: process.env.AI_MODEL || 'gpt-4',
          temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.7,
          max_tokens: parseInt(process.env.AI_MAX_TOKENS) || 500,
          system_prompt: 'You are a helpful customer service assistant. Respond professionally and helpfully to customer inquiries.',
          custom_instructions: ''
        };
      }
      
      return this.settings;
      
    } catch (error) {
      logger.error(`Load AI settings error: ${error.message}`);
      throw error;
    }
  }
  
  async generateResponse(userMessage, conversationHistory = [], instanceId = null) {
    try {
      await this.loadSettings();
      
      if (!this.settings.api_key) {
        logger.warn('AI API key not configured');
        return null;
      }
      
      const messages = this.buildMessageContext(userMessage, conversationHistory);
      
      let response;
      
      switch (this.settings.api_provider) {
        case 'openai':
          response = await this.callOpenAI(messages);
          break;
        case 'anthropic':
          response = await this.callAnthropic(messages);
          break;
        case 'google':
          response = await this.callGoogleAI(messages);
          break;
        default:
          response = await this.callOpenAI(messages);
      }
      
      logger.info(`AI response generated for user ${this.userId}`);
      
      return response;
      
    } catch (error) {
      logger.error(`AI generate response error: ${error.message}`);
      return null;
    }
  }
  
  buildMessageContext(userMessage, conversationHistory) {
    const messages = [];
    
    // Add system prompt
    const systemPrompt = this.settings.system_prompt || 'You are a helpful assistant.';
    messages.push({
      role: 'system',
      content: systemPrompt + (this.settings.custom_instructions ? `\n\n${this.settings.custom_instructions}` : '')
    });
    
    // Add conversation history (last few messages)
    const recentHistory = conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      if (msg.direction === 'incoming') {
        messages.push({
          role: 'user',
          content: msg.content
        });
      } else if (msg.is_ai_response) {
        messages.push({
          role: 'assistant',
          content: msg.content
        });
      }
    }
    
    // Add current user message
    messages.push({
      role: 'user',
      content: userMessage
    });
    
    return messages;
  }
  
  async callOpenAI(messages) {
    try {
      const response = await axios.post(
        process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions',
        {
          model: this.settings.model,
          messages: messages,
          temperature: this.settings.temperature,
          max_tokens: this.settings.max_tokens
        },
        {
          headers: {
            'Authorization': `Bearer ${this.settings.api_key}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );
      
      return response.data.choices[0].message.content;
      
    } catch (error) {
      logger.error(`OpenAI API error: ${error.message}`);
      if (error.response) {
        logger.error(`OpenAI API response: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }
  
  async callAnthropic(messages) {
    try {
      // Extract system message
      const systemMessage = messages.find(m => m.role === 'system');
      const conversationMessages = messages.filter(m => m.role !== 'system');
      
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: this.settings.model || 'claude-3-sonnet-20240229',
          max_tokens: this.settings.max_tokens,
          temperature: this.settings.temperature,
          system: systemMessage ? systemMessage.content : undefined,
          messages: conversationMessages
        },
        {
          headers: {
            'x-api-key': this.settings.api_key,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );
      
      return response.data.content[0].text;
      
    } catch (error) {
      logger.error(`Anthropic API error: ${error.message}`);
      throw error;
    }
  }
  
  async callGoogleAI(messages) {
    try {
      // Convert messages to Google AI format
      const contents = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));
      
      const systemMessage = messages.find(m => m.role === 'system');
      
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.settings.model || 'gemini-pro'}:generateContent?key=${this.settings.api_key}`,
        {
          contents: contents,
          generationConfig: {
            temperature: this.settings.temperature,
            maxOutputTokens: this.settings.max_tokens
          },
          systemInstruction: systemMessage ? {
            parts: [{ text: systemMessage.content }]
          } : undefined
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );
      
      return response.data.candidates[0].content.parts[0].text;
      
    } catch (error) {
      logger.error(`Google AI API error: ${error.message}`);
      throw error;
    }
  }
  
  async saveSettings(settings) {
    try {
      const existing = await db.query(
        'SELECT id FROM ai_settings WHERE user_id = ?',
        [this.userId]
      );
      
      if (existing.length > 0) {
        // Update existing settings
        await db.query(
          'UPDATE ai_settings SET api_provider = ?, api_key = ?, model = ?, temperature = ?, max_tokens = ?, system_prompt = ?, custom_instructions = ? WHERE user_id = ?',
          [
            settings.api_provider,
            settings.api_key,
            settings.model,
            settings.temperature,
            settings.max_tokens,
            settings.system_prompt,
            settings.custom_instructions,
            this.userId
          ]
        );
      } else {
        // Insert new settings
        await db.query(
          'INSERT INTO ai_settings (user_id, api_provider, api_key, model, temperature, max_tokens, system_prompt, custom_instructions) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            this.userId,
            settings.api_provider,
            settings.api_key,
            settings.model,
            settings.temperature,
            settings.max_tokens,
            settings.system_prompt,
            settings.custom_instructions
          ]
        );
      }
      
      logger.info(`AI settings saved for user ${this.userId}`);
      
    } catch (error) {
      logger.error(`Save AI settings error: ${error.message}`);
      throw error;
    }
  }
}

module.exports = AIService;
