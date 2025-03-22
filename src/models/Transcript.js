'use strict';

/**
 * Transcript class representing a transcription result
 */
class Transcript {
  /**
   * Create a new Transcript instance
   * @param {Object} data - Transcript data
   * @param {string} data.id - Unique identifier
   * @param {string} data.text - Transcribed text content
   * @param {string} data.languageCode - Language code of the transcription
   * @param {number} data.confidence - Confidence score (0-1)
   * @param {number} data.processingTime - Time taken to process in milliseconds
   * @param {string|number} data.audioDuration - Duration of the audio in seconds
   * @param {Date} [data.createdAt] - Timestamp of creation
   */
  constructor(data) {
    this.id = data.id || `transcript_${Date.now()}`;
    this.text = data.text || '';
    this.languageCode = data.languageCode;
    this.confidence = data.confidence || 0;
    this.processingTime = data.processingTime || 0;
    this.audioDuration = data.audioDuration || 'unknown';
    this.createdAt = data.createdAt || new Date();
    
    this.validate();
  }

  /**
   * Validate transcript data
   * @throws {Error} If validation fails
   */
  validate() {
    if (!this.languageCode) {
      throw new Error('Transcript must have a language code');
    }
    
    if (typeof this.confidence !== 'number' || this.confidence < 0 || this.confidence > 1) {
      throw new Error('Confidence must be a number between 0 and 1');
    }
  }

  /**
   * Get the transcription quality rating
   * @returns {string} Quality rating (excellent, good, fair, poor)
   */
  getQualityRating() {
    if (this.confidence >= 0.9) return 'excellent';
    if (this.confidence >= 0.75) return 'good';
    if (this.confidence >= 0.6) return 'fair';
    return 'poor';
  }

  /**
   * Convert transcript to a plain object
   * @returns {Object} Plain object representation
   */
  toObject() {
    return {
      id: this.id,
      text: this.text,
      languageCode: this.languageCode,
      confidence: this.confidence,
      processingTime: this.processingTime,
      audioDuration: this.audioDuration,
      createdAt: this.createdAt,
      qualityRating: this.getQualityRating()
    };
  }

  /**
   * Create a Transcript instance from a plain object
   * @param {Object} obj - Plain object with transcript data
   * @returns {Transcript} Transcript instance
   */
  static fromObject(obj) {
    return new Transcript(obj);
  }
}

module.exports = { Transcript };