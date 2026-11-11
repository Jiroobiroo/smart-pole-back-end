/**
 * Telemetry Routes
 * Endpoints for sensor ingestion, power calculation, history, and alerts.
 */
const express = require('express');
const router = express.Router();
const telemetryController = require('../controllers/telemetryController');
const { validateTelemetry } = require('../middleware/validator');

// POST /api/v1/telemetry - Record sensor readings (V, I, Temp) & compute Power
router.post('/', validateTelemetry, telemetryController.recordTelemetry);

// GET /api/v1/telemetry/latest - Live sensor readings & calculated power
router.get('/latest', telemetryController.getLatestTelemetry);

// GET /api/v1/telemetry/history - Historical telemetry data
router.get('/history', telemetryController.getTelemetryHistory);

// GET /api/v1/telemetry/alerts - Active fault detection alerts
router.get('/alerts', telemetryController.getAlerts);

// POST /api/v1/telemetry/alerts/clear - Clear alerts
router.post('/alerts/clear', telemetryController.clearAlerts);

module.exports = router;

