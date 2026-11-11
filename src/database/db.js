/**
 * SQLite Database Connection & Initialization
 * Manages local database file, schema migration, and async SQL helper methods.
 */
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const logger = require('../middleware/logger');

// Ensure data directory exists
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'smartpole.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    logger.error('Failed to connect to SQLite database', err);
  } else {
    logger.info(`Connected to SQLite database at: ${dbPath}`);
  }
});

// Initialize Tables
db.serialize(() => {
  // WAL mode and busy timeout for concurrent read/write support
  db.run(`PRAGMA journal_mode = WAL;`);
  db.run(`PRAGMA busy_timeout = 5000;`);

  // Table 1: Current Lamp State
  db.run(`
    CREATE TABLE IF NOT EXISTS lamp_status (
      pole_id TEXT PRIMARY KEY,
      status TEXT NOT NULL,
      brightness INTEGER DEFAULT 100,
      mode TEXT DEFAULT 'MANUAL',
      last_updated TEXT NOT NULL
    )
  `);

  // Table 2: Audit Event Logs
  db.run(`
    CREATE TABLE IF NOT EXISTS lamp_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pole_id TEXT NOT NULL,
      action TEXT NOT NULL,
      previous_state TEXT,
      new_state TEXT,
      brightness INTEGER,
      source TEXT NOT NULL,
      timestamp TEXT NOT NULL
    )
  `);

  // Table 3: Telemetry History (ready for sensor integration)
  db.run(`
    CREATE TABLE IF NOT EXISTS telemetry_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pole_id TEXT NOT NULL,
      temperature REAL NOT NULL,
      voltage REAL NOT NULL,
      current REAL NOT NULL,
      power REAL NOT NULL,
      system_status TEXT NOT NULL,
      timestamp TEXT NOT NULL
    )
  `);

  // Seed initial row in lamp_status if empty
  db.run(
    `INSERT OR IGNORE INTO lamp_status (pole_id, status, brightness, mode, last_updated) VALUES (?, ?, ?, ?, ?)`,
    ['POLE-001', 'OFF', 100, 'MANUAL', new Date().toISOString()]
  );
});

/**
 * Promisified DB query helpers
 */
const dbHelpers = {
  db,
  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }
};

module.exports = dbHelpers;
