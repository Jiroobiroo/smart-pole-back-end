/**
 * Database Inspector Routes
 * Allows the frontend and operators to directly inspect raw SQLite tables.
 */
const express = require('express');
const router = express.Router();
const dbHelpers = require('../database/db');

// GET /api/v1/database/viewer - Fetch all rows from database tables
router.get('/viewer', async (req, res, next) => {
  try {
    const lampStatusRows = await dbHelpers.all(`SELECT * FROM lamp_status`);
    const lampLogsRows = await dbHelpers.all(`SELECT * FROM lamp_logs ORDER BY id DESC LIMIT 50`);
    const lcdStatusRows = await dbHelpers.all(`SELECT * FROM lcd_status`);
    const lcdLogsRows = await dbHelpers.all(`SELECT * FROM lcd_logs ORDER BY id DESC LIMIT 50`);

    return res.status(200).json({
      success: true,
      database: 'smartpole.db (SQLite)',
      tables: {
        lamp_status: {
          count: lampStatusRows.length,
          rows: lampStatusRows
        },
        lamp_logs: {
          count: lampLogsRows.length,
          rows: lampLogsRows
        },
        lcd_status: {
          count: lcdStatusRows.length,
          rows: lcdStatusRows
        },
        lcd_logs: {
          count: lcdLogsRows.length,
          rows: lcdLogsRows
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/database/clear-logs - Clear log records
router.post('/clear-logs', async (req, res, next) => {
  try {
    await dbHelpers.run(`DELETE FROM lamp_logs`);
    return res.status(200).json({
      success: true,
      message: 'lamp_logs table cleared successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

