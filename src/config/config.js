'use strict';

require('dotenv').config();

/**
 * Application configuration object with all environment variables
 */
const config = {
  port: process.env.PORT || 3000,
  environment: process.env.NODE_ENV || 'development',
  
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/transcript-bot'
  },
  
  whatsapp: {
    apiUrl: process.env.WHATSAPP_API_URL,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN
  },
  
  googleSpeech: {
    credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};

/**
 * Validates that all required configuration values are present
 * @throws {Error} If any required configuration is missing
 */
const validateConfig = () => {
  const requiredConfigs = [
    'whatsapp.apiUrl',
    'whatsapp.phoneNumberId',
    'whatsapp.accessToken',
    'whatsapp.webhookVerifyToken',
    'googleSpeech.credentialsPath'
  ];
  
  const missingConfigs = requiredConfigs.filter(configPath => {
    const keys = configPath.split('.');
    let current = config;
    
    for (const key of keys) {
      if (!current[key]) return true;
      current = current[key];
    }
    
    return false;
  });
  
  if (missingConfigs.length > 0) {
    throw new Error(`Missing required configurations: ${missingConfigs.join(', ')}`);
  }
};

// Validate on module import
validateConfig();

module.exports = { config, validateConfig };