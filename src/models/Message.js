'use strict';

/**
 * Message class representing a WhatsApp message
 */
class Message {
  /**
   * Create a new Message instance
   * @param {Object} data - Message data
   * @param {string} data.id - Unique identifier
   * @param {string} data.from - Sender's phone number
   * @param {string} data.to - Recipient's phone number
   * @param {string} data.body - Message content
   * @param {string} data.type - Message type (text, audio, etc.)
   * @param {string} [data.mediaUrl] - URL to media content if applicable
   * @param {string} [data.mediaType] - MIME type of media if applicable
   * @param {Date} [data.timestamp] - Message timestamp
   */
  constructor(data) {
    this.id = data.id || `msg_${Date.now()}`;
    this.from = data.from;
    this.to = data.to;
    this.body = data.body || '';
    this.type = data.type || 'text';
    this.mediaUrl = data.mediaUrl || null;
    this.mediaType = data.mediaType || null;
    this.timestamp = data.timestamp || new Date();
    
    this.validate();
  }

  /**
   * Validate message data
   * @throws {Error} If validation fails
   */
  validate() {
    if (!this.from) {
      throw new Error('Message must have a sender (from)');
    }
    
    if (!this.to) {
      throw new Error('Message must have a recipient (to)');
    }
    
    if (this.type === 'audio' && !this.mediaUrl) {
      throw new Error('Audio messages must have a mediaUrl');
    }
  }

  /**
   * Convert message to a plain object
   * @returns {Object} Plain object representation
   */
  toObject() {
    return {
      id: this.id,
      from: this.from,
      to: this.to,
      body: this.body,
      type: this.type,
      mediaUrl: this.mediaUrl,
      mediaType: this.mediaType,
      timestamp: this.timestamp
    };
  }

  /**
   * Create a Message instance from a plain object
   * @param {Object} obj - Plain object with message data
   * @returns {Message} Message instance
   */
  static fromObject(obj) {
    return new Message(obj);
  }
}

module.exports = { Message };