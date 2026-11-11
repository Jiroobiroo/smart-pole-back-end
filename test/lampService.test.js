const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const lampService = require('../src/services/lampService');

describe('LampService Unit Tests', () => {
  beforeEach(() => {
    lampService.reset();
  });

  test('Initial state matches defaults', () => {
    const status = lampService.getStatus();
    assert.equal(status.status, 'OFF');
    assert.equal(status.brightness, 100);
    assert.equal(status.poleId, 'POLE-001');
    assert.equal(status.mode, 'MANUAL');
    assert.ok(status.lastUpdated);
  });

  test('setState updates status and records history event', () => {
    const updated = lampService.setState('ON', 'DASHBOARD');
    assert.equal(updated.status, 'ON');

    const history = lampService.getHistory();
    assert.equal(history.length, 1);
    assert.equal(history[0].previousState, 'OFF');
    assert.equal(history[0].newState, 'ON');
    assert.equal(history[0].source, 'DASHBOARD');
  });

  test('toggle switches state back and forth', () => {
    assert.equal(lampService.getStatus().status, 'OFF');

    const toggled1 = lampService.toggle();
    assert.equal(toggled1.status, 'ON');

    const toggled2 = lampService.toggle();
    assert.equal(toggled2.status, 'OFF');
  });

  test('setBrightness updates brightness level', () => {
    const res = lampService.setBrightness(45, 'TEST');
    assert.equal(res.brightness, 45);
    assert.equal(res.status, 'ON'); // Brightness > 0 turns lamp ON

    const offRes = lampService.setBrightness(0, 'TEST');
    assert.equal(offRes.brightness, 0);
    assert.equal(offRes.status, 'OFF'); // Brightness = 0 turns lamp OFF
  });

  test('History honors limit parameter', () => {
    for (let i = 0; i < 10; i++) {
      lampService.toggle();
    }
    const limited = lampService.getHistory(3);
    assert.equal(limited.length, 3);
  });
});
