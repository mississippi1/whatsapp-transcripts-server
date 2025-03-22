'use strict';

const speech = require('@google-cloud/speech');
const { logger } = require('../utils/logger');
const { Transcript } = require('../models/Transcript');

/**
 * Service for handling speech-to-text transcription
 */
class TranscriptionService {
  constructor() {
    // Initialize Google Cloud Speech client
    this.client = new speech.SpeechClient();
  }

  /**
   * Transcribe audio content to text
   * @param {Buffer} audioBuffer - Audio content as a buffer
   * @param {string} languageCode - Language code (e.g., 'en-US', 'he-IL')
   * @returns {Promise<Object>} Transcription result
   */
  async transcribeAudio(audioBuffer, languageCode = 'en-US') {
    try {
      // Start tracking time for performance metrics
      const startTime = Date.now();
      
      // Prepare the request for Google Speech-to-Text API
      const request = {
        audio: {
          content: audioBuffer.toString('base64'),
        },
        config: {
          encoding: 'LINEAR16',
          sampleRateHertz: 16000,
          languageCode: languageCode,
          enableAutomaticPunctuation: true,
          model: 'default',
        },
      };
      
      // Send the request to Google Speech-to-Text API
      const [response] = await this.client.recognize(request);
      
      // Process the response
      let transcriptionText = '';
      let confidence = 0;
      
      if (response.results && response.results.length > 0) {
        // Combine all transcription results
        transcriptionText = response.results
          .map(result => result.alternatives[0].transcript)
          .join(' ');
          
        // Calculate average confidence score
        confidence = response.results
          .reduce((sum, result) => sum + result.alternatives[0].confidence, 0) / response.results.length;
      }
      
      // Calculate processing time
      const processingTime = Date.now() - startTime;
      
      // Create a transcript record
      const transcript = new Transcript({
        text: transcriptionText,
        languageCode,
        confidence,
        processingTime,
        audioDuration: response.totalBilledTime || 'unknown'
      });
      
      logger.info('Transcription completed', {
        languageCode,
        confidence,
        processingTime,
        textLength: transcriptionText.length
      });
      
      return transcript;
    } catch (error) {
      logger.error('Transcription error', { error: error.message, languageCode });
      throw new Error(`Failed to transcribe audio: ${error.message}`);
    }
  }

  /**
   * Check if a language is supported
   * @param {string} languageCode - Language code to check
   * @returns {boolean} Whether the language is supported
   */
  isLanguageSupported(languageCode) {
    const supportedLanguages = ['en-US', 'he-IL']; // Add more as needed
    return supportedLanguages.includes(languageCode);
  }
}

module.exports = { TranscriptionService };