/**
 * Input validation middleware for Lamp commands
 */

const validateLampState = (req, res, next) => {
  const { state } = req.body;

  if (state === undefined || state === null) {
    return res.status(400).json({
      success: false,
      error: 'Missing required field: "state". Expected "ON" or "OFF".'
    });
  }

  const normalized = String(state).trim().toUpperCase();
  if (normalized !== 'ON' && normalized !== 'OFF') {
    return res.status(400).json({
      success: false,
      error: `Invalid lamp state: "${state}". State must be either "ON" or "OFF".`
    });
  }

  // Attach normalized state
  req.body.state = normalized;
  next();
};

const validateLampDimming = (req, res, next) => {
  const { brightness } = req.body;

  if (brightness === undefined || brightness === null) {
    return res.status(400).json({
      success: false,
      error: 'Missing required field: "brightness". Value must be between 0 and 100.'
    });
  }

  const numericValue = Number(brightness);
  if (!Number.isInteger(numericValue) || numericValue < 0 || numericValue > 100) {
    return res.status(400).json({
      success: false,
      error: `Invalid brightness value: "${brightness}". Must be an integer between 0 and 100.`
    });
  }

  req.body.brightness = numericValue;
  next();
};

module.exports = {
  validateLampState,
  validateLampDimming
};
