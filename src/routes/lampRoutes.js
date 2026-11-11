/**
 * Lamp Control API Routes
 * Endpoints for status, ON/OFF switching, toggle, dimming, and history.
 */
const express = require('express');
const router = express.Router();
const lampController = require('../controllers/lampController');
const { validateLampState, validateLampDimming } = require('../middleware/validator');

// GET /api/v1/lamp - Get current lamp state
router.get('/', lampController.getLampStatus);

// POST /api/v1/lamp/state - Turn ON or OFF
router.post('/state', validateLampState, lampController.setLampState);

// POST /api/v1/lamp/toggle - Invert current state
router.post('/toggle', lampController.toggleLamp);

// POST /api/v1/lamp/dimming - Adjust brightness (0 - 100%)
router.post('/dimming', validateLampDimming, lampController.setLampBrightness);

// GET /api/v1/lamp/history - View recent control logs
router.get('/history', lampController.getLampHistory);

module.exports = router;
