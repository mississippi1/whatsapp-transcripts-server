'use strict';

const express = require('express');
const helmet = require('helmet');
const { config } = require('./config/config');
const { setupRoutes } = require('./controllers/webhookController');
const { logger } = require('./utils/logger');
const { errorHandler } = require('./utils/errorHandler');

// Create Express application
const app = express();

// Apply security middleware
app.use(helmet());

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// Set up routes
setupRoutes(app);

// Global error handler
app.use(errorHandler);

// Start the server
const server = app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port} in ${config.environment} mode`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});

module.exports = { app, server };