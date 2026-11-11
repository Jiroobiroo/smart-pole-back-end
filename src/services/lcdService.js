/**
 * LCD Display Service
 * Manages 16x2 (or 20x4) LCD text buffers, cursor position, backlight, and history.
 */
const config = require('../config');
const logger = require('../middleware/logger');

class LcdService {
  constructor() {
    this.poleId = config.poleId;
    this.line1 = 'SMART POLE SYS';
    this.line2 = 'SYSTEM READY';
    this.backlight = true;
    this.maxCharsPerLine = 16; // Standard 16x2 LCD
    this.lastUpdated = new Date().toISOString();
    this.history = [];
    this.maxHistorySize = 30;

    logger.info(`LcdService initialized for pole [${this.poleId}]`);
  }

  /**
   * Get current LCD display state
   */
  getStatus() {
    return {
      poleId: this.poleId,
      line1: this.line1,
      line2: this.line2,
      fullText: `${this.line1}\n${this.line2}`,
      backlight: this.backlight,
      maxCharsPerLine: this.maxCharsPerLine,
      lastUpdated: this.lastUpdated
    };
  }

  /**
   * Set text on LCD (either a specific line or both lines)
   * @param {Object} params
   * @param {string} [params.line1]
   * @param {string} [params.line2]
   * @param {string} [params.message] - Convenience string, split across lines if needed
   * @param {string} source
   */
  setMessage({ line1, line2, message }, source = 'REST_API') {
    const prev = { line1: this.line1, line2: this.line2 };

    if (message !== undefined) {
      // Split message by newline or chunk to 16 chars
      const lines = message.split('\n');
      this.line1 = (lines[0] || '').substring(0, this.maxCharsPerLine);
      this.line2 = (lines[1] || '').substring(0, this.maxCharsPerLine);
    } else {
      if (line1 !== undefined) {
        this.line1 = String(line1).substring(0, this.maxCharsPerLine);
      }
      if (line2 !== undefined) {
        this.line2 = String(line2).substring(0, this.maxCharsPerLine);
      }
    }

    this.lastUpdated = new Date().toISOString();

    const event = {
      id: this.history.length + 1,
      type: 'TEXT_UPDATE',
      line1: this.line1,
      line2: this.line2,
      source,
      timestamp: this.lastUpdated
    };

    this._recordEvent(event);
    logger.info(`LCD on [${this.poleId}] updated: L1="${this.line1}" | L2="${this.line2}" (Source: ${source})`);

    return this.getStatus();
  }

  /**
   * Send a single character/letter to the LCD
   * Requirement: "Send text or individual letters from the central system to the LCD"
   * @param {string} char
   * @param {number} targetLine - 1 or 2
   * @param {string} source
   */
  appendChar(char, targetLine = 1, source = 'REST_API') {
    const singleChar = String(char).charAt(0);
    if (!singleChar) {
      throw new Error('Character cannot be empty');
    }

    if (targetLine === 2) {
      if (this.line2.length >= this.maxCharsPerLine) {
        this.line2 = this.line2.substring(1) + singleChar; // Scroll left if full
      } else {
        this.line2 += singleChar;
      }
    } else {
      if (this.line1.length >= this.maxCharsPerLine) {
        this.line1 = this.line1.substring(1) + singleChar;
      } else {
        this.line1 += singleChar;
      }
    }

    this.lastUpdated = new Date().toISOString();

    const event = {
      id: this.history.length + 1,
      type: 'CHAR_APPENDED',
      char: singleChar,
      targetLine,
      line1: this.line1,
      line2: this.line2,
      source,
      timestamp: this.lastUpdated
    };

    this._recordEvent(event);
    return this.getStatus();
  }

  /**
   * Clear the LCD screen
   * @param {string} source
   */
  clear(source = 'REST_API') {
    this.line1 = '';
    this.line2 = '';
    this.lastUpdated = new Date().toISOString();

    const event = {
      id: this.history.length + 1,
      type: 'CLEARED',
      source,
      timestamp: this.lastUpdated
    };

    this._recordEvent(event);
    logger.info(`LCD on [${this.poleId}] cleared (Source: ${source})`);

    return this.getStatus();
  }

  /**
   * Toggle or set backlight
   * @param {boolean} [state]
   * @param {string} source
   */
  setBacklight(state, source = 'REST_API') {
    this.backlight = state !== undefined ? Boolean(state) : !this.backlight;
    this.lastUpdated = new Date().toISOString();

    const event = {
      id: this.history.length + 1,
      type: 'BACKLIGHT_CHANGE',
      backlight: this.backlight,
      source,
      timestamp: this.lastUpdated
    };

    this._recordEvent(event);
    logger.info(`LCD backlight on [${this.poleId}] set to: ${this.backlight}`);

    return this.getStatus();
  }

  /**
   * Get recent message history
   * @param {number} limit
   */
  getHistory(limit = 10) {
    const count = Math.min(Math.max(1, parseInt(limit, 10) || 10), this.maxHistorySize);
    return this.history.slice(-count).reverse();
  }

  _recordEvent(event) {
    this.history.push(event);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  reset() {
    this.line1 = 'SMART POLE SYS';
    this.line2 = 'SYSTEM READY';
    this.backlight = true;
    this.lastUpdated = new Date().toISOString();
    this.history = [];
  }
}

module.exports = new LcdService();
