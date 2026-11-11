/**
 * Express Application Configuration
 */
const express = require('express');
const cors = require('cors');
const path = require('path');
const logger = require('./middleware/logger');
const lampRoutes = require('./routes/lampRoutes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Global Middleware
app.use(cors());
app.use(express.json());
app.use(logger.requestMiddleware);

// Serve static frontend files (Quick-test Dashboard)
app.use(express.static(path.join(__dirname, '../public')));

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

// Fallthrough & Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
