'use strict';

const multer = require('multer');
const { WhatsAppService } = require('../services/whatsappService');
const { TranscriptionService } = require('../services/transcriptionService');
const { AudioService } = require('../services/audioService');
const { logger } = require('../utils/logger');
const { Message } = require('../models/Message');
const { config } = require('../config/config');

// Configure multer storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 16 * 1024 * 1024 } // 16MB limit
});

// Initialize services
const whatsappService = new WhatsAppService();
const transcriptionService = new TranscriptionService();
const audioService = new AudioService();

/**
 * Verify WhatsApp webhook
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
const verifyWebhook = (req, res) => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // Check if mode and token are correct
    if (mode === 'subscribe' && token === config.whatsapp.webhookVerifyToken) {
      logger.info('Webhook verified successfully');
      // Respond with the challenge token sent by WhatsApp
      res.status(200).send(challenge);
    } else {
      // Verification failed
      logger.error('Webhook verification failed', { mode, token });
      res.sendStatus(403);
    }
  } catch (error) {
    logger.error('Error verifying webhook:', error);
    res.sendStatus(500);
  }
};

/**
 * Handle incoming WhatsApp messages
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const handleWhatsAppWebhook = async (req, res, next) => {
  try {
    // Always respond with 200 OK first to acknowledge receipt
    res.status(200).send('EVENT_RECEIVED');
    
    // Check if this is a WhatsApp message
    if (!req.body.object || req.body.object !== 'whatsapp_business_account') {
      logger.info('Received non-WhatsApp event');
      return;
    }
    
    // Extract entries from payload
    const entries = req.body.entry || [];
    
    for (const entry of entries) {
      // Process each message in the entry
      const changes = entry.changes || [];
      
      for (const change of changes) {
        if (change.field !== 'messages') continue;
        
        const messages = change.value?.messages || [];
        
        for (const message of messages) {
          await processMessage(message, change.value?.contacts || [], change.value?.metadata);
        }
      }
    }
  } catch (error) {
    logger.error('Error handling webhook:', error);
    next(error);
  }
};

/**
 * Process an individual message
 * @param {Object} message - Message object from webhook
 * @param {Array} contacts - Contacts information
 * @param {Object} metadata - Metadata information
 */
const processMessage = async (message, contacts, metadata) => {
  try {
    if (!message || !message.from) {
      logger.error('Invalid message format');
      return;
    }
    
    // Extract sender information
    const senderPhone = message.from;
    const senderName = contacts[0]?.profile?.name || 'Unknown';
    
    logger.info('Processing message', { from: senderPhone, type: message.type });
    
    // Handle different message types
    if (message.type === 'audio') {
      await processAudioMessage(message, senderPhone);
    } else if (message.type === 'text' && message.text?.body) {
      if (message.text.body.toLowerCase().startsWith('language:')) {
        // Handle language preference setting
        const language = message.text.body.toLowerCase().replace('language:', '').trim();
        await handleLanguageSetting(senderPhone, language);
      } else {
        // Send instructions for unsupported message content
        await whatsappService.sendMessage(
          senderPhone,
          'Please send a voice recording or set your language preference with "language: English" or "language: Hebrew"'
        );
      }
    } else {
      // Send instructions for unsupported message types
      await whatsappService.sendMessage(
        senderPhone,
        'Please send a voice recording or set your language preference with "language: English" or "language: Hebrew"'
      );
    }
  } catch (error) {
    logger.error('Error processing message:', error);
  }
};

/**
 * Process an audio message for transcription
 * @param {Object} message - Audio message object
 * @param {string} senderPhone - Sender's phone number
 */
const processAudioMessage = async (message, senderPhone) => {
  try {
    // Send acknowledgment message
    await whatsappService.sendMessage(
      senderPhone,
      'Received your audio. Transcribing now...'
    );
    
    // Get audio media ID
    const mediaId = message.audio?.id;
    if (!mediaId) {
      throw new Error('Audio media ID not found');
    }
    
    // Download the audio file
    const audioBuffer = await whatsappService.downloadMedia(mediaId);
    
    // Get user's language preference (default to English)
    const language = await whatsappService.getUserLanguagePreference(senderPhone) || 'en-US';
    
    // Convert the audio to the required format
    const convertedAudio = await audioService.convertAudio(audioBuffer);
    
    // Send the audio for transcription
    const transcriptionResult = await transcriptionService.transcribeAudio(convertedAudio, language);
    
    // Send the transcription back to the user
    await whatsappService.sendMessage(
      senderPhone,
      `Transcription:\n\n${transcriptionResult.text}`
    );
    
    // Log the successful transcription
    logger.info('Successfully transcribed audio', { 
      user: senderPhone,
      language,
      duration: transcriptionResult.audioDuration 
    });
  } catch (error) {
    logger.error('Error processing audio:', error);
    await whatsappService.sendMessage(
      senderPhone,
      'Sorry, there was an error transcribing your audio. Please try again.'
    );
  }
};

/**
 * Handle setting a user's language preference
 * @param {string} userPhone - User's phone number
 * @param {string} language - Language preference (english or hebrew)
 */
const handleLanguageSetting = async (userPhone, language) => {
  let languageCode;
  let confirmationMessage;
  
  if (language === 'english') {
    languageCode = 'en-US';
    confirmationMessage = 'Language set to English. You can now send voice recordings for transcription.';
  } else if (language === 'hebrew') {
    languageCode = 'he-IL';
    confirmationMessage = 'Language set to Hebrew. You can now send voice recordings for transcription.';
  } else {
    confirmationMessage = 'Unsupported language. Please use "language: English" or "language: Hebrew".';
  }
  
  if (languageCode) {
    await whatsappService.setUserLanguagePreference(userPhone, languageCode);
  }
  
  await whatsappService.sendMessage(userPhone, confirmationMessage);
};

/**
 * Set up all routes for the application
 * @param {Express} app - Express application instance
 */
const setupRoutes = (app) => {
  // Webhook verification endpoint
  app.get('/webhook', verifyWebhook);
  
  // Webhook for WhatsApp messages
  app.post('/webhook', handleWhatsAppWebhook);
  app.get('/', verifyWebhook);
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });
};

  

module.exports = { setupRoutes, handleWhatsAppWebhook, verifyWebhook };
