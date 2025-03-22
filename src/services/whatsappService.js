'use strict';

const axios = require('axios');
const FormData = require('form-data');
const { config } = require('../config/config');
const { logger } = require('../utils/logger');

/**
 * Service for handling WhatsApp communications via the official WhatsApp Business API
 */
class WhatsAppService {
  constructor() {
    this.apiUrl = config.whatsapp.apiUrl;
    this.phoneNumberId = config.whatsapp.phoneNumberId;
    this.accessToken = config.whatsapp.accessToken;
    this.headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json'
    };
    this.userLanguagePreferences = new Map(); // In-memory storage for language preferences
  }

  /**
   * Send a text message to a WhatsApp user
   * @param {string} to - Recipient's phone number
   * @param {string} message - Message content
   * @returns {Promise<Object>} API response
   */
  async sendMessage(to, message) {
    try {
      const endpoint = `${this.apiUrl}/${this.phoneNumberId}/messages`;
      
      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'text',
        text: {
          body: message
        }
      };
      
      const response = await axios.post(endpoint, payload, { headers: this.headers });
      
      logger.info('Message sent successfully', { to, messageId: response.data?.messages?.[0]?.id });
      return response.data;
    } catch (error) {
      logger.error('Error sending message', { 
        to, 
        error: error.response?.data || error.message 
      });
      throw new Error(`Failed to send WhatsApp message: ${error.message}`);
    }
  }

  /**
   * Download media from WhatsApp Media API
   * @param {string} mediaId - ID of the media to download
   * @returns {Promise<Buffer>} Media content as a buffer
   */
  async downloadMedia(mediaId) {
    try {
      // 1. First, get the media URL
      const mediaUrlEndpoint = `${this.apiUrl}/${mediaId}`;
      const mediaInfoResponse = await axios.get(mediaUrlEndpoint, { 
        headers: this.headers 
      });
      
      if (!mediaInfoResponse.data || !mediaInfoResponse.data.url) {
        throw new Error('Media URL not found');
      }
      
      const mediaUrl = mediaInfoResponse.data.url;
      
      // 2. Then download the media content
      const mediaResponse = await axios.get(mediaUrl, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        },
        responseType: 'arraybuffer'
      });
      
      logger.info('Media downloaded successfully', { mediaId });
      return Buffer.from(mediaResponse.data);
    } catch (error) {
      logger.error('Error downloading media', { 
        mediaId, 
        error: error.response?.data || error.message 
      });
      throw new Error(`Failed to download media: ${error.message}`);
    }
  }

  /**
   * Upload media to WhatsApp Media API
   * @param {Buffer} buffer - Media content as a buffer
   * @param {string} mimeType - MIME type of the media
   * @returns {Promise<string>} Media ID
   */
  async uploadMedia(buffer, mimeType) {
    try {
      const endpoint = `${this.apiUrl}/${this.phoneNumberId}/media`;
      
      const form = new FormData();
      form.append('file', buffer, {
        filename: `audio_${Date.now()}.ogg`,
        contentType: mimeType
      });
      form.append('messaging_product', 'whatsapp');
      form.append('type', mimeType);
      
      const response = await axios.post(endpoint, form, {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${this.accessToken}`
        }
      });
      
      logger.info('Media uploaded successfully', { mediaId: response.data?.id });
      return response.data.id;
    } catch (error) {
      logger.error('Error uploading media', { 
        error: error.response?.data || error.message 
      });
      throw new Error(`Failed to upload media: ${error.message}`);
    }
  }

  /**
   * Set a user's language preference
   * @param {string} userPhone - User's phone number
   * @param {string} languageCode - Language code (e.g., 'en-US', 'he-IL')
   */
  async setUserLanguagePreference(userPhone, languageCode) {
    this.userLanguagePreferences.set(userPhone, languageCode);
    logger.info('Updated language preference', { user: userPhone, language: languageCode });
    
    // In a production app, you would store this in a database
    // Example: await userRepository.updateLanguagePreference(userPhone, languageCode);
  }

  /**
   * Get a user's language preference
   * @param {string} userPhone - User's phone number
   * @returns {Promise<string|null>} Language code or null if not set
   */
  async getUserLanguagePreference(userPhone) {
    const preference = this.userLanguagePreferences.get(userPhone);
    
    // In a production app, you would retrieve this from a database
    // Example: const preference = await userRepository.getLanguagePreference(userPhone);
    
    return preference || null;
  }

  /**
   * Mark a message as read
   * @param {string} messageId - ID of the message to mark as read
   * @returns {Promise<Object>} API response
   */
  async markMessageAsRead(messageId) {
    try {
      const endpoint = `${this.apiUrl}/${this.phoneNumberId}/messages`;
      
      const payload = {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId
      };
      
      const response = await axios.post(endpoint, payload, { headers: this.headers });
      
      logger.info('Message marked as read', { messageId });
      return response.data;
    } catch (error) {
      logger.error('Error marking message as read', { 
        messageId, 
        error: error.response?.data || error.message 
      });
      throw new Error(`Failed to mark message as read: ${error.message}`);
    }
  }
}

module.exports = { WhatsAppService };