/**
 * Input validation middleware for Smart Pole commands and telemetry
 */

// --- Lamp Validators ---
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

// --- LCD Display Validators ---
const validateLcdMessage = (req, res, next) => {
  const { line1, line2, message } = req.body;

  if (line1 === undefined && line2 === undefined && message === undefined) {
    return res.status(400).json({
      success: false,
      error: 'Please provide at least one of: "message", "line1", or "line2".'
    });
  }

  next();
};

const validateLcdChar = (req, res, next) => {
  const { char, line } = req.body;

  if (char === undefined || char === null || String(char).length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Missing required field: "char". Must be a non-empty string or character.'
    });
  }

  if (line !== undefined) {
    const lineNum = Number(line);
    if (lineNum !== 1 && lineNum !== 2) {
      return res.status(400).json({
        success: false,
        error: 'Invalid "line" value. Must be 1 or 2.'
      });
    }
    req.body.line = lineNum;
  } else {
    req.body.line = 1;
  }

  req.body.char = String(char).charAt(0);
  next();
};

// --- Telemetry Validators ---
const validateTelemetry = (req, res, next) => {
  const { temperature, voltage, current } = req.body;

  const errors = [];

  if (temperature === undefined || isNaN(Number(temperature))) {
    errors.push('"temperature" is required and must be a number (°C).');
  } else {
    const temp = Number(temperature);
    if (temp < -50 || temp > 150) {
      errors.push('"temperature" value is out of physical range (-50 to 150 °C).');
    }
  }

  if (voltage === undefined || isNaN(Number(voltage))) {
    errors.push('"voltage" is required and must be a number (Volts).');
  } else {
    const v = Number(voltage);
    if (v < 0 || v > 500) {
      errors.push('"voltage" value is out of realistic range (0 to 500 V).');
    }
  }

  if (current === undefined || isNaN(Number(current))) {
    errors.push('"current" is required and must be a number (Amperes).');
  } else {
    const c = Number(current);
    if (c < 0 || c > 100) {
      errors.push('"current" value is out of realistic range (0 to 100 A).');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors
    });
  }

  req.body.temperature = Number(temperature);
  req.body.voltage = Number(voltage);
  req.body.current = Number(current);
  next();
};

module.exports = {
  validateLampState,
  validateLampDimming,
  validateLcdMessage,
  validateLcdChar,
  validateTelemetry
};
