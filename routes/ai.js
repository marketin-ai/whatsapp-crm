const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const AIService = require('../services/aiService');
const logger = require('../utils/logger');

// Get AI settings
router.get('/settings', authenticateToken, async (req, res) => {
  try {
    const aiService = new AIService(req.user.userId);
    const settings = await aiService.loadSettings();
    
    // Don't send API key to frontend
    const safeSettings = {
      api_provider: settings.api_provider,
      model: settings.model,
      temperature: settings.temperature,
      max_tokens: settings.max_tokens,
      system_prompt: settings.system_prompt,
      custom_instructions: settings.custom_instructions,
      has_api_key: !!settings.api_key
    };
    
    res.json({
      success: true,
      settings: safeSettings
    });
    
  } catch (error) {
    logger.error(`Get AI settings error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch AI settings'
    });
  }
});

// Update AI settings
router.put('/settings', authenticateToken, async (req, res) => {
  try {
    const { api_provider, api_key, model, temperature, max_tokens, system_prompt, custom_instructions } = req.body;
    
    const aiService = new AIService(req.user.userId);
    await aiService.saveSettings({
      api_provider,
      api_key,
      model,
      temperature,
      max_tokens,
      system_prompt,
      custom_instructions
    });
    
    res.json({
      success: true,
      message: 'AI settings updated successfully'
    });
    
  } catch (error) {
    logger.error(`Update AI settings error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to update AI settings'
    });
  }
});

// Test AI response
router.post('/test', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }
    
    const aiService = new AIService(req.user.userId);
    const response = await aiService.generateResponse(message, []);
    
    res.json({
      success: true,
      response
    });
    
  } catch (error) {
    logger.error(`Test AI error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to generate AI response'
    });
  }
});

module.exports = router;
