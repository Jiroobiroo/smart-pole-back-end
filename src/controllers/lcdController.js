/**
 * LCD Controller
 * Handles LCD text updates, individual character streaming, backlight, and clearing.
 */
const lcdService = require('../services/lcdService');

const getLcdStatus = (req, res, next) => {
  try {
    const status = lcdService.getStatus();
    return res.status(200).json({
      success: true,
      data: status
    });
  } catch (error) {
    next(error);
  }
};

const setLcdMessage = (req, res, next) => {
  try {
    const { line1, line2, message } = req.body;
    const source = req.headers['x-client-id'] || 'REST_API';
    const updated = lcdService.setMessage({ line1, line2, message }, source);

    return res.status(200).json({
      success: true,
      message: 'LCD text updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

const appendLcdChar = (req, res, next) => {
  try {
    const { char, line } = req.body;
    const source = req.headers['x-client-id'] || 'REST_API';
    const updated = lcdService.appendChar(char, line, source);

    return res.status(200).json({
      success: true,
      message: `Appended character '${char}' to line ${line}`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

const clearLcd = (req, res, next) => {
  try {
    const source = req.headers['x-client-id'] || 'REST_API';
    const updated = lcdService.clear(source);

    return res.status(200).json({
      success: true,
      message: 'LCD screen cleared',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

const setBacklight = (req, res, next) => {
  try {
    const { backlight } = req.body;
    const source = req.headers['x-client-id'] || 'REST_API';
    const updated = lcdService.setBacklight(backlight, source);

    return res.status(200).json({
      success: true,
      message: `LCD backlight set to ${updated.backlight}`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

const getLcdHistory = (req, res, next) => {
  try {
    const { limit } = req.query;
    const history = lcdService.getHistory(limit);

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
  getLcdStatus,
  setLcdMessage,
  appendLcdChar,
  clearLcd,
  setBacklight,
  getLcdHistory
};
