'use strict';

const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const { Readable } = require('stream');
const { logger } = require('../utils/logger');

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

/**
 * Service for handling audio file operations
 */
class AudioService {
  /**
   * Convert audio to the format required by the transcription service
   * @param {Buffer} audioBuffer - Audio content as a buffer
   * @returns {Promise<Buffer>} Converted audio as a buffer
   */
  async convertAudio(audioBuffer) {
    return new Promise((resolve, reject) => {
      // Create readable stream from buffer
      const inputStream = new Readable();
      inputStream.push(audioBuffer);
      inputStream.push(null);
      
      // Create buffer to store converted audio
      const chunks = [];
      
      // Set up ffmpeg conversion
      ffmpeg(inputStream)
        .outputFormat('wav')
        .audioChannels(1)
        .audioFrequency(16000)
        .audioCodec('pcm_s16le')
        .on('error', (err) => {
          logger.error('Error converting audio', { error: err.message });
          reject(new Error(`Audio conversion failed: ${err.message}`));
        })
        .on('end', () => {
          logger.info('Audio conversion completed successfully');
          // Combine chunks into a single buffer
          const outputBuffer = Buffer.concat(chunks);
          resolve(outputBuffer);
        })
        .pipe()
        .on('data', (chunk) => {
          chunks.push(chunk);
        });
    });
  }


  /**
   * Check if audio file is valid and supported
   * @param {Buffer} audioBuffer - Audio content as a buffer
   * @returns {Promise<boolean>} Whether the audio is valid
   */
  async validateAudio(audioBuffer) {
    return new Promise((resolve, reject) => {
      // Create readable stream from buffer
      const inputStream = new Readable();
      inputStream.push(audioBuffer);
      inputStream.push(null);
      
      ffmpeg(inputStream)
        .ffprobe((err, metadata) => {
          if (err) {
            logger.error('Invalid audio file', { error: err.message });
            resolve(false);
            return;
          }
          
          // Check if file has audio streams
          const hasAudioStream = metadata.streams.some(stream => stream.codec_type === 'audio');
          
          if (!hasAudioStream) {
            logger.error('File contains no audio streams');
            resolve(false);
            return;
          }
          
          logger.info('Audio file validated successfully');
          resolve(true);
        });
    });
  }
}

module.exports = { AudioService };