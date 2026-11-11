/**
 * Telemetry & Electrical Monitoring Service
 * Handles sensor readings (temperature, voltage, current),
 * computes real-time power consumption (P = V * I),
 * performs fault detection, and stores historical telemetry data.
 */
const config = require('../config');
const logger = require('../middleware/logger');

class TelemetryService {
  constructor() {
    this.poleId = config.poleId;

    // Thresholds for Fault Detection (Optional Extension in specs)
    this.thresholds = {
      tempMax: 60.0,       // °C: enclosure over-temperature
      voltageMin: 190.0,   // V: undervoltage fault
      voltageMax: 250.0,   // V: overvoltage fault
      currentMax: 5.0      // A: overcurrent fault
    };

    // Initial Telemetry State
    this.latest = {
      poleId: this.poleId,
      temperature: 24.5,   // °C
      voltage: 220.0,      // Volts
      current: 0.45,       // Amperes
      power: 99.0,         // Watts (P = V * I)
      energyWh: 0.0,       // Accumulated Watt-hours
      systemStatus: 'NORMAL', // 'NORMAL' | 'WARNING' | 'CRITICAL'
      alerts: [],
      lastUpdated: new Date().toISOString()
    };

    this.history = [];
    this.maxHistorySize = 100;
    this.lastTimestamp = Date.now();

    logger.info(`TelemetryService initialized for pole [${this.poleId}]`);
  }

  /**
   * Get latest telemetry readings & calculated power
   */
  getLatest() {
    return { ...this.latest };
  }

  /**
   * Record new sensor telemetry from Pole Controller
   * Computes Power = Voltage * Current, checks thresholds, and accumulates energy.
   * @param {Object} readings
   * @param {number} readings.temperature - Enclosure temperature in °C
   * @param {number} readings.voltage - Electrical voltage in V
   * @param {number} readings.current - Electrical current in A
   * @param {string} source
   */
  recordTelemetry({ temperature, voltage, current }, source = 'POLE_CONTROLLER') {
    const tempNum = Number(temperature);
    const voltNum = Number(voltage);
    const currNum = Number(current);

    // Mandatory Requirement: Power calculation (P = V * I)
    const calculatedPower = parseFloat((voltNum * currNum).toFixed(2));

    // Calculate energy accumulated since last reading (Wh = Power * deltaHours)
    const now = Date.now();
    const deltaHours = Math.max(0, (now - this.lastTimestamp) / (1000 * 3600));
    const addedEnergyWh = parseFloat((calculatedPower * deltaHours).toFixed(4));
    this.latest.energyWh = parseFloat((this.latest.energyWh + addedEnergyWh).toFixed(2));
    this.lastTimestamp = now;

    // Fault Detection (Optional Extension)
    const alerts = [];
    if (tempNum > this.thresholds.tempMax) {
      alerts.push(`High Temperature Alert: ${tempNum}°C exceeds threshold of ${this.thresholds.tempMax}°C`);
    }
    if (voltNum < this.thresholds.voltageMin) {
      alerts.push(`Undervoltage Alert: ${voltNum}V below minimum threshold of ${this.thresholds.voltageMin}V`);
    } else if (voltNum > this.thresholds.voltageMax) {
      alerts.push(`Overvoltage Alert: ${voltNum}V exceeds maximum threshold of ${this.thresholds.voltageMax}V`);
    }
    if (currNum > this.thresholds.currentMax) {
      alerts.push(`Overcurrent Alert: ${currNum}A exceeds threshold of ${this.thresholds.currentMax}A`);
    }

    let systemStatus = 'NORMAL';
    if (alerts.length > 0) {
      systemStatus = alerts.some((a) => a.includes('Overcurrent') || a.includes('High Temperature'))
        ? 'CRITICAL'
        : 'WARNING';
    }

    const isoDate = new Date().toISOString();

    this.latest = {
      poleId: this.poleId,
      temperature: tempNum,
      voltage: voltNum,
      current: currNum,
      power: calculatedPower,
      energyWh: this.latest.energyWh,
      systemStatus,
      alerts,
      source,
      lastUpdated: isoDate
    };

    // Store in history log
    this._recordHistory({
      id: this.history.length + 1,
      ...this.latest
    });

    if (alerts.length > 0) {
      logger.warn(`Telemetry Alert on [${this.poleId}]: ${alerts.join(' | ')}`);
    } else {
      logger.info(`Telemetry recorded: V=${voltNum}V, I=${currNum}A, P=${calculatedPower}W, T=${tempNum}°C`);
    }

    return this.getLatest();
  }

  /**
   * Retrieve historical telemetry readings
   * @param {number} limit
   */
  getHistory(limit = 20) {
    const count = Math.min(Math.max(1, parseInt(limit, 10) || 20), this.maxHistorySize);
    return this.history.slice(-count).reverse();
  }

  /**
   * Retrieve active alerts
   */
  getAlerts() {
    return {
      poleId: this.poleId,
      status: this.latest.systemStatus,
      alerts: this.latest.alerts,
      lastChecked: this.latest.lastUpdated
    };
  }

  /**
   * Clear active alerts
   */
  clearAlerts() {
    this.latest.alerts = [];
    this.latest.systemStatus = 'NORMAL';
    this.latest.lastUpdated = new Date().toISOString();
    return this.getLatest();
  }

  _recordHistory(snapshot) {
    this.history.push(snapshot);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  reset() {
    this.latest = {
      poleId: this.poleId,
      temperature: 24.5,
      voltage: 220.0,
      current: 0.45,
      power: 99.0,
      energyWh: 0.0,
      systemStatus: 'NORMAL',
      alerts: [],
      lastUpdated: new Date().toISOString()
    };
    this.history = [];
    this.lastTimestamp = Date.now();
  }
}

module.exports = new TelemetryService();

