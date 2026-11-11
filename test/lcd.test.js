const { test, describe, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../src/app');
const lcdService = require('../src/services/lcdService');

let server;
let baseUrl;

const request = (path, options = {}) => {
  return new Promise((resolve, reject) => {
    const url = `${baseUrl}${path}`;
    const reqOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = http.request(url, reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(body);
        } catch {
          parsed = body;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: parsed
        });
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
};

describe('Smart Pole LCD Display API Tests', () => {
  test('Server setup for LCD tests', async () => {
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  beforeEach(() => {
    lcdService.reset();
  });

  after(() => {
    if (server) {
      server.close();
    }
  });

  test('GET /api/v1/lcd returns default display state', async () => {
    const res = await request('/api/v1/lcd');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.line1, 'SMART POLE SYS');
    assert.equal(res.body.data.line2, 'SYSTEM READY');
    assert.equal(res.body.data.backlight, true);
  });

  test('POST /api/v1/lcd/message updates line 1 and line 2', async () => {
    const res = await request('/api/v1/lcd/message', {
      method: 'POST',
      body: { line1: 'CAUTION ROADWORK', line2: 'SPEED LIMIT 30' }
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.line1, 'CAUTION ROADWORK');
    assert.equal(res.body.data.line2, 'SPEED LIMIT 30');
  });

  test('POST /api/v1/lcd/char appends a single letter to line 1', async () => {
    lcdService.clear();
    const res = await request('/api/v1/lcd/char', {
      method: 'POST',
      body: { char: 'A', line: 1 }
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.line1, 'A');
  });

  test('POST /api/v1/lcd/clear wipes both lines', async () => {
    const res = await request('/api/v1/lcd/clear', { method: 'POST' });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.line1, '');
    assert.equal(res.body.data.line2, '');
  });

  test('POST /api/v1/lcd/backlight toggles backlight', async () => {
    const res = await request('/api/v1/lcd/backlight', {
      method: 'POST',
      body: { backlight: false }
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.backlight, false);
  });
});
