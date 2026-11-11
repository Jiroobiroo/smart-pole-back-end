/**
 * LCD Display Routes
 * Endpoints for LCD text messages, single character input, clearing, backlight, and history.
 */
const express = require('express');
const router = express.Router();
const lcdController = require('../controllers/lcdController');
const { validateLcdMessage, validateLcdChar } = require('../middleware/validator');

// GET /api/v1/lcd - Get current LCD status & screen text
router.get('/', lcdController.getLcdStatus);

// POST /api/v1/lcd/message - Set full line or message text
router.post('/message', validateLcdMessage, lcdController.setLcdMessage);

// POST /api/v1/lcd/char - Send individual character/letter
router.post('/char', validateLcdChar, lcdController.appendLcdChar);

// POST /api/v1/lcd/clear - Clear LCD screen
router.post('/clear', lcdController.clearLcd);

// POST /api/v1/lcd/backlight - Set or toggle backlight
router.post('/backlight', lcdController.setBacklight);

// GET /api/v1/lcd/history - View message history
router.get('/history', lcdController.getLcdHistory);

module.exports = router;

