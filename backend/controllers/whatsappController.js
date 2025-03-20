// backend/controllers/whatsappController.js
const audioService = require('../services/audioService');
const twilioService = require('../services/twilioService');

exports.handleIncomingMessage = async (req, res) => {
  try {
    // Twilio sends the payload as form data. Example fields:
    // From, Body, MediaUrl0, MediaContentType0, etc.
    const { From, MediaUrl0, MediaContentType0 } = req.body;
    
    if (MediaContentType0 && MediaContentType0.startsWith('audio/')) {
      // Process the audio file: download and transcribe
      const transcriptData = await audioService.processAudio(MediaUrl0, From);
      
      // Build a reply message with both transcripts.
      const replyMessage = `Transcription (EN): ${transcriptData.english}\nTranscription (HE): ${transcriptData.hebrew}`;
      
      // Send the reply back via Twilio API to the same WhatsApp number
      await twilioService.sendMessage(From, replyMessage);
      
      // Respond to Twilio with a simple 200 OK message.
      return res.status(200).send('<Response></Response>');
    } else {
      return res.status(400).send('<Response><Message>No audio provided</Message></Response>');
    }
  } catch (error) {
    console.error('Error processing WhatsApp message:', error);
    return res.status(500).send('<Response><Message>Internal Server Error</Message></Response>');
  }
};
