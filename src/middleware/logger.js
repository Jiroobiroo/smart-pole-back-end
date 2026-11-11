/**
 * Application & Request Logger
 * Standardized logging for operations, incoming requests, and errors.
 */

const formatTimestamp = () => new Date().toISOString();

const logger = {
  info: (message, meta = {}) => {
    console.log(`[INFO]  [${formatTimestamp()}] ${message}`, Object.keys(meta).length ? JSON.stringify(meta) : '');
  },
  warn: (message, meta = {}) => {
    console.warn(`[WARN]  [${formatTimestamp()}] ${message}`, Object.keys(meta).length ? JSON.stringify(meta) : '');
  },
  error: (message, error = {}) => {
    console.error(`[ERROR] [${formatTimestamp()}] ${message}`, error?.stack || error);
  },
  requestMiddleware: (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      const logMsg = `${req.method} ${req.originalUrl} - Status: ${res.statusCode} (${duration}ms)`;
      if (res.statusCode >= 500) {
        logger.error(logMsg);
      } else if (res.statusCode >= 400) {
        logger.warn(logMsg);
      } else {
        logger.info(logMsg);
      }
    });
    next();
  }
};

module.exports = logger;

