/**
 * Lamp Service
 * Manages lamp operational state, business rules, and event logs.
 */
const config = require('../config');
const logger = require('../middleware/logger');

class LampService {
  constructor() {
    this.poleId = config.poleId;
    this.status = config.defaultLampState; // 'ON' or 'OFF'
    this.brightness = config.defaultBrightness; // 0 to 100%
    this.mode = 'MANUAL'; // 'MANUAL' or 'AUTO'
    this.lastUpdated = new Date().toISOString();
    this.history = [];
    this.maxHistorySize = 50;

    // Log initialization
    logger.info(`LampService initialized for pole [${this.poleId}] with status [${this.status}]`);
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
   * Update lamp status to ON or OFF
   * @param {string} newState - 'ON' or 'OFF'
   * @param {string} source - 'API', 'HARDWARE', 'SCHEDULE', etc.
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
   * Adjust lamp brightness (0 - 100%)
   * Optional extension requirement from project specifications
   * @param {number} level
   * @param {string} source
   */
  setBrightness(level, source = 'REST_API') {
    const previousBrightness = this.brightness;
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

  /**
   * Record an event in internal bounded history log
   * @private
   */
  _recordEvent(event) {
    this.history.push(event);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  /**
   * Reset state (useful for automated testing)
   */
  reset() {
    this.status = config.defaultLampState;
    this.brightness = config.defaultBrightness;
    this.mode = 'MANUAL';
    this.lastUpdated = new Date().toISOString();
    this.history = [];
  }
}

// Export singleton instance
module.exports = new LampService();

