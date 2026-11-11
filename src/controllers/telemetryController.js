/**
 * Telemetry Controller
 * Handles incoming sensor readings, retrieves live status, history, and active alerts.
 */
const telemetryService = require('../services/telemetryService');

/**
 * POST /api/v1/telemetry
 * Receive sensor measurements (temperature, voltage, current)
 */
const recordTelemetry = (req, res, next) => {
  try {
    const { temperature, voltage, current } = req.body;
    const source = req.headers['x-client-id'] || 'POLE_CONTROLLER';

    const recorded = telemetryService.recordTelemetry({ temperature, voltage, current }, source);

    return res.status(201).json({
      success: true,
      message: 'Telemetry readings processed successfully',
      data: recorded
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/telemetry/latest
 * Retrieve current readings, calculated power, and alerts
 */
const getLatestTelemetry = (req, res, next) => {
  try {
    const latest = telemetryService.getLatest();
    return res.status(200).json({
      success: true,
      data: latest
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/telemetry/history
 * Retrieve historical telemetry entries
 */
const getTelemetryHistory = (req, res, next) => {
  try {
    const { limit } = req.query;
    const history = telemetryService.getHistory(limit);

    return res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/telemetry/alerts
 * Retrieve active fault detection alerts
 */
const getAlerts = (req, res, next) => {
  try {
    const alerts = telemetryService.getAlerts();
    return res.status(200).json({
      success: true,
      data: alerts
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/telemetry/alerts/clear
 * Clear active alerts
 */
const clearAlerts = (req, res, next) => {
  try {
    const cleared = telemetryService.clearAlerts();
    return res.status(200).json({
      success: true,
      message: 'Active alerts cleared successfully',
      data: cleared
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  recordTelemetry,
  getLatestTelemetry,
  getTelemetryHistory,
  getAlerts,
  clearAlerts
};

