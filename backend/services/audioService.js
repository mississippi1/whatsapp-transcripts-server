// backend/services/audioService.js
const fetch = require('node-fetch');
const speechService = require('./speechService');

exports.processAudio = async (audioUrl, fromNumber) => {
  // Download the audio file from the provided MediaUrl
  const response = await fetch(audioUrl);
  if (!response.ok) {
    throw new Error(`Failed to download audio from ${audioUrl}`);
  }
  const audioBuffer = await response.buffer();
  
  // Get transcriptions in English and Hebrew
  const transcriptEnglish = await speechService.transcribe(audioBuffer, 'en-US');
  const transcriptHebrew = await speechService.transcribe(audioBuffer, 'he-IL');
  
  return {
    from: fromNumber,
    english: transcriptEnglish,
    hebrew: transcriptHebrew,
    timestamp: new Date().toISOString(),
  };
};
