// backend/services/speechService.js
const speech = require('@google-cloud/speech');
// Ensure GOOGLE_APPLICATION_CREDENTIALS is set or your service account has appropriate IAM roles.
const client = new speech.SpeechClient();

exports.transcribe = async (audioBuffer, languageCode) => {
  const audioBytes = audioBuffer.toString('base64');
  const request = {
    audio: { content: audioBytes },
    config: {
      encoding: 'OGG_OPUS',         // Adjust this if your audio format differs.
      sampleRateHertz: 48000,         // Change according to your audio properties.
      languageCode: languageCode,
    },
  };
  
  const [response] = await client.recognize(request);
  const transcription = response.results
    .map(result => result.alternatives[0].transcript)
    .join('\n');
  
  return transcription;
};
