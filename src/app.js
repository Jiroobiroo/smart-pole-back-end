/**
 * Express Application Configuration
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./docs/swaggerSpec');
const logger = require('./middleware/logger');
const lampRoutes = require('./routes/lampRoutes');
const lcdRoutes = require('./routes/lcdRoutes');
const telemetryRoutes = require('./routes/telemetryRoutes');
const databaseRoutes = require('./routes/databaseRoutes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Global Middleware
app.use(cors());
app.use(express.json());
app.use(logger.requestMiddleware);

// Serve static frontend files (Quick-test Dashboard)
app.use(express.static(path.join(__dirname, '../public')));

// Swagger API Documentation (Swagger UI & Raw JSON endpoint)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Smart Pole API Docs'
}));
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// System Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Smart Pole Backend API'
  });
});

// Mount Routes
app.use('/api/v1/lamp', lampRoutes);
app.use('/api/v1/lcd', lcdRoutes);
app.use('/api/v1/telemetry', telemetryRoutes);
app.use('/api/v1/database', databaseRoutes);

// Fallthrough & Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
