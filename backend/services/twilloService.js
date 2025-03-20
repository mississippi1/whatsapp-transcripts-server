// backend/services/twilioService.js
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

// The TWILIO_WHATSAPP_NUMBER should be in the format: 'whatsapp:+1234567890'
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;

exports.sendMessage = async (to, message) => {
  // 'to' is expected to be in the format: 'whatsapp:+19876543210'
  const response = await client.messages.create({
    from: TWILIO_WHATSAPP_NUMBER,
    to: to,
    body: message,
  });
  return response;
};
