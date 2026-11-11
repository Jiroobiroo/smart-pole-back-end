/**
 * Centralized Error Handling Middleware
 */
const logger = require('./logger');

const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: `Resource not found: ${req.method} ${req.originalUrl}`
  });
};

const errorHandler = (err, req, res, next) => {
  logger.error(`Unhandled Exception on ${req.method} ${req.originalUrl}: ${err.message}`, err);

  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
};

module.exports = {
  notFoundHandler,
  errorHandler
};

