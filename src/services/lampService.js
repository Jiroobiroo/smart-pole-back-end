/**
 * Lamp Service
 * Manages lamp operational state, business rules, and persists everything to SQLite.
 */
const config = require('../config');
const logger = require('../middleware/logger');
const dbHelpers = require('../database/db');

class LampService {
  constructor() {
    this.poleId = config.poleId;
    this.status = config.defaultLampState; // 'ON' or 'OFF'
    this.brightness = config.defaultBrightness; // 0 to 100%
    this.mode = 'MANUAL'; // 'MANUAL' or 'AUTO'
    this.lastUpdated = new Date().toISOString();
    this.history = [];
    this.maxHistorySize = 50;

    // Load initial state from SQLite
    this._loadInitialStateFromDb();

    logger.info(`LampService initialized for pole [${this.poleId}] with status [${this.status}]`);
  }

  async _loadInitialStateFromDb() {
    try {
      const row = await dbHelpers.get(`SELECT * FROM lamp_status WHERE pole_id = ?`, [this.poleId]);
      if (row) {
        this.status = row.status;
        this.brightness = row.brightness;
        this.mode = row.mode;
        this.lastUpdated = row.last_updated;
        logger.info(`Loaded lamp state from SQLite: ${this.status} (Brightness: ${this.brightness}%)`);
      }
    } catch (err) {
      logger.warn('Could not read lamp_status from SQLite during startup; using defaults.', err);
    }
  }

  /**
   * Get current lamp state
   */
  getStatus() {
    return {
      poleId: this.poleId,
      status: this.status,
      brightness: this.brightness,
      mode: this.mode,
      lastUpdated: this.lastUpdated
    };
  }

  /**
   * Update lamp status to ON or OFF and persist to SQLite
   * @param {string} newState - 'ON' or 'OFF'
   * @param {string} source - 'REST_API', 'DASHBOARD_UI', etc.
   */
  setState(newState, source = 'REST_API') {
    const previousState = this.status;

    this.status = newState;
    this.lastUpdated = new Date().toISOString();

    const event = {
      id: this.history.length + 1,
      type: 'STATE_CHANGE',
      previousState,
      newState: this.status,
      brightness: this.brightness,
      source,
      timestamp: this.lastUpdated
    };

    this._recordEvent(event);
    this._persistToDb('STATE_CHANGE', previousState, this.status, this.brightness, source);

    logger.info(`Lamp on [${this.poleId}] switched: ${previousState} -> ${this.status} (Source: ${source})`);

    return this.getStatus();
  }

  /**
   * Toggle lamp state between ON and OFF
   * @param {string} source
   */
  toggle(source = 'REST_API') {
    const nextState = this.status === 'ON' ? 'OFF' : 'ON';
    return this.setState(nextState, source);
  }

  /**
   * Adjust lamp brightness (0 - 100%) and persist to SQLite
   * @param {number} level
   * @param {string} source
   */
  setBrightness(level, source = 'REST_API') {
    const previousBrightness = this.brightness;
    const previousState = this.status;
    this.brightness = level;

    // If brightness is set > 0 while lamp is OFF, turn it ON automatically
    if (level > 0 && this.status === 'OFF') {
      this.status = 'ON';
    } else if (level === 0 && this.status === 'ON') {
      this.status = 'OFF';
    }

    this.lastUpdated = new Date().toISOString();

    const event = {
      id: this.history.length + 1,
      type: 'BRIGHTNESS_CHANGE',
      previousBrightness,
      newBrightness: this.brightness,
      lampStatus: this.status,
      source,
      timestamp: this.lastUpdated
    };

    this._recordEvent(event);
    this._persistToDb('BRIGHTNESS_CHANGE', previousState, this.status, this.brightness, source);

    logger.info(`Lamp brightness on [${this.poleId}] changed: ${previousBrightness}% -> ${this.brightness}%`);

    return this.getStatus();
  }

  /**
   * Retrieve event history
   * @param {number} limit
   */
  getHistory(limit = 20) {
    const count = Math.min(Math.max(1, parseInt(limit, 10) || 20), this.maxHistorySize);
    return this.history.slice(-count).reverse();
  }

  _recordEvent(event) {
    this.history.push(event);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  /**
   * Asynchronously update SQLite tables (lamp_status and lamp_logs)
   */
  async _persistToDb(action, previousState, newState, brightness, source) {
    try {
      // 1. Update current status table (upsert)
      await dbHelpers.run(
        `INSERT OR REPLACE INTO lamp_status (pole_id, status, brightness, mode, last_updated)
         VALUES (?, ?, ?, ?, ?)`,
        [this.poleId, newState, brightness, this.mode, this.lastUpdated]
      );

      // 2. Insert into event audit log table
      await dbHelpers.run(
        `INSERT INTO lamp_logs (pole_id, action, previous_state, new_state, brightness, source, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [this.poleId, action, previousState, newState, brightness, source, this.lastUpdated]
      );
    } catch (err) {
      logger.error('Failed to persist lamp state to SQLite', err);
    }
  }

  reset() {
    this.status = config.defaultLampState;
    this.brightness = config.defaultBrightness;
    this.mode = 'MANUAL';
    this.lastUpdated = new Date().toISOString();
    this.history = [];
  }
}

module.exports = new LampService();
