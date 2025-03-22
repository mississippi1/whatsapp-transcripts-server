'use strict';

const winston = require('winston');
const { config } = require('../config/config');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { service: 'transcript-bot' },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          info => `${info.timestamp} ${info.level}: ${info.message} ${info.stack || ''} ${
            Object.keys(info).filter(key => 
              !['timestamp', 'level', 'message', 'stack', 'service'].includes(key)
            ).length > 0 
              ? `\n${JSON.stringify(
                  Object.fromEntries(
                    Object.entries(info).filter(([key]) => 
                      !['timestamp', 'level', 'message', 'stack', 'service'].includes(key)
                    )
                  ), 
                  null, 2
                )}`
              : ''
          }`
        )
      )
    }),
    
    // File transports
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    })
  ]
});

// Add a stream for Morgan middleware if needed
logger.stream = {
  write: (message) => logger.info(message.trim())
};

module.exports = { logger };