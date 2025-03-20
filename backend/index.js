// backend/index.js
const express = require('express');
const bodyParser = require('body-parser');
const whatsappController = require('./controllers/whatsappController');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Webhook endpoint for incoming WhatsApp messages from Twilio
app.post('/webhook/whatsapp', whatsappController.handleIncomingMessage);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
