/**
 * Server Entry Point
 */
const app = require('./app');
const config = require('./config');
const logger = require('./middleware/logger');

const server = app.listen(config.port, () => {
  logger.info(`========================================================`);
  logger.info(`🚀 Smart Pole Backend API running on port ${config.port}`);
  logger.info(`📍 Environment : ${config.nodeEnv}`);
  logger.info(`💡 Target Pole : ${config.poleId}`);
  logger.info(`🌐 Endpoints   : http://localhost:${config.port}/api/v1/lamp`);
  logger.info(`📚 Swagger UI  : http://localhost:${config.port}/api-docs`);
  logger.info(`📄 OpenAPI JSON: http://localhost:${config.port}/api-docs.json`);
  logger.info(`🩺 Health Check: http://localhost:${config.port}/health`);
  logger.info(`========================================================`);
});

// Graceful Shutdown
const handleShutdown = (signal) => {
  logger.info(`Received ${signal}. Shutting down server gracefully...`);
  server.close(() => {
    logger.info('Server closed. Process terminating.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

module.exports = server;

