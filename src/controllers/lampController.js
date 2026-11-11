/**
 * Lamp Controller
 * Handles incoming HTTP requests, invokes the LampService, and formats responses.
 */
const lampService = require('../services/lampService');

/**
 * GET /api/v1/lamp
 * Retrieve current lamp status
 */
const getLampStatus = (req, res, next) => {
  try {
    const status = lampService.getStatus();
    return res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/lamp/state
 * Set lamp state directly (ON or OFF)
 */
const setLampState = (req, res, next) => {
  try {
    const { state } = req.body;
    const source = req.headers['x-client-id'] || 'REST_API';
    const updatedStatus = lampService.setState(state, source);

    return res.status(200).json({
      success: true,
      message: `Lamp successfully turned ${state}`,
      data: updatedStatus
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/lamp/toggle
 * Toggle lamp between ON and OFF
 */
const toggleLamp = (req, res, next) => {
  try {
    const source = req.headers['x-client-id'] || 'REST_API';
    const updatedStatus = lampService.toggle(source);

    return res.status(200).json({
      success: true,
      message: `Lamp successfully toggled to ${updatedStatus.status}`,
      data: updatedStatus
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/lamp/dimming
 * Adjust brightness level (0 - 100%)
 */
const setLampBrightness = (req, res, next) => {
  try {
    const { brightness } = req.body;
    const source = req.headers['x-client-id'] || 'REST_API';
    const updatedStatus = lampService.setBrightness(brightness, source);

    return res.status(200).json({
      success: true,
      message: `Lamp brightness set to ${brightness}%`,
      data: updatedStatus
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/lamp/history
 * Retrieve recent switching events
 */
const getLampHistory = (req, res, next) => {
  try {
    const { limit } = req.query;
    const history = lampService.getHistory(limit);

    return res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLampStatus,
  setLampState,
  toggleLamp,
  setLampBrightness,
  getLampHistory
};
