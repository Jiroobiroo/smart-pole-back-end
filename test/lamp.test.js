const { test, describe, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../src/app');
const lampService = require('../src/services/lampService');

let server;
let baseUrl;

// Helper to make HTTP requests
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

describe('Smart Pole Lamp Control API Tests', () => {
  // Start server on an ephemeral port before tests
  test('Server setup', async () => {
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  beforeEach(() => {
    lampService.reset();
  });

  after(() => {
    if (server) {
      server.close();
    }
  });

  test('GET /health returns healthy status', async () => {
    const res = await request('/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'healthy');
  });

  test('GET /api-docs.json returns OpenAPI specification', async () => {
    const res = await request('/api-docs.json');
    assert.equal(res.status, 200);
    assert.equal(res.body.openapi, '3.0.0');
    assert.ok(res.body.paths['/api/v1/lamp']);
  });

  test('GET /api/v1/database/viewer returns SQLite tables', async () => {
    const res = await request('/api/v1/database/viewer');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.tables.lamp_status);
    assert.ok(res.body.tables.lamp_logs);
  });

  test('GET /api/v1/lamp returns default initial status', async () => {
    const res = await request('/api/v1/lamp');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, 'OFF');
    assert.equal(res.body.data.poleId, 'POLE-001');
    assert.equal(res.body.data.brightness, 100);
  });

  test('POST /api/v1/lamp/state turns lamp ON', async () => {
    const res = await request('/api/v1/lamp/state', {
      method: 'POST',
      body: { state: 'ON' }
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, 'ON');

    // Verify GET reflects the update
    const getRes = await request('/api/v1/lamp');
    assert.equal(getRes.body.data.status, 'ON');
  });

  test('POST /api/v1/lamp/state turns lamp OFF', async () => {
    // First turn ON
    await request('/api/v1/lamp/state', { method: 'POST', body: { state: 'ON' } });

    // Then turn OFF
    const res = await request('/api/v1/lamp/state', {
      method: 'POST',
      body: { state: 'OFF' }
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, 'OFF');
  });

  test('POST /api/v1/lamp/toggle inverts the lamp state', async () => {
    // Initial is OFF, toggle should make it ON
    const toggle1 = await request('/api/v1/lamp/toggle', { method: 'POST' });
    assert.equal(toggle1.status, 200);
    assert.equal(toggle1.body.data.status, 'ON');

    // Toggle again should make it OFF
    const toggle2 = await request('/api/v1/lamp/toggle', { method: 'POST' });
    assert.equal(toggle2.status, 200);
    assert.equal(toggle2.body.data.status, 'OFF');
  });

  test('POST /api/v1/lamp/state rejects missing or invalid state with 400', async () => {
    const missingRes = await request('/api/v1/lamp/state', {
      method: 'POST',
      body: {}
    });
    assert.equal(missingRes.status, 400);
    assert.equal(missingRes.body.success, false);

    const invalidRes = await request('/api/v1/lamp/state', {
      method: 'POST',
      body: { state: 'HALF_ON' }
    });
    assert.equal(invalidRes.status, 400);
    assert.equal(invalidRes.body.success, false);
  });

  test('POST /api/v1/lamp/dimming adjusts brightness', async () => {
    const res = await request('/api/v1/lamp/dimming', {
      method: 'POST',
      body: { brightness: 60 }
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.brightness, 60);
    assert.equal(res.body.data.status, 'ON'); // Brightness > 0 turns lamp ON
  });

  test('POST /api/v1/lamp/dimming rejects invalid brightness with 400', async () => {
    const outOfBounds = await request('/api/v1/lamp/dimming', {
      method: 'POST',
      body: { brightness: 150 }
    });
    assert.equal(outOfBounds.status, 400);
    assert.equal(outOfBounds.body.success, false);

    const notNumber = await request('/api/v1/lamp/dimming', {
      method: 'POST',
      body: { brightness: 'bright' }
    });
    assert.equal(notNumber.status, 400);
    assert.equal(notNumber.body.success, false);
  });

  test('GET /api/v1/lamp/history records events', async () => {
    await request('/api/v1/lamp/state', { method: 'POST', body: { state: 'ON' } });
    await request('/api/v1/lamp/state', { method: 'POST', body: { state: 'OFF' } });

    const res = await request('/api/v1/lamp/history');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.length >= 2);
  });

  test('Unknown route returns 404 JSON', async () => {
    const res = await request('/api/v1/unknown-endpoint');
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
  });
});

