import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateEstimatedCost,
  calculateSavingsUSD,
  formatDuration,
  formatTimestampSrt,
  formatTimestampVtt,
  DEFAULT_COMMERCIAL_API_RATE_PER_MIN,
} from './costCalculator.ts';

test('calculateEstimatedCost calculates cost accurately', () => {
  // 60 seconds (1 minute) at $0.006/min should be 0.006
  assert.equal(calculateEstimatedCost(60, 0.006), 0.006);
  // 300 seconds (5 minutes) at $0.006/min should be 0.03
  assert.equal(calculateEstimatedCost(300, 0.006), 0.03);
  // zero or negative returns 0
  assert.equal(calculateEstimatedCost(0, 0.006), 0);
  assert.equal(calculateEstimatedCost(-10, 0.006), 0);
});

test('calculateSavingsUSD calculates savings based on audio minutes', () => {
  // 1,420 minutes at $0.006/min = 8.52 USD
  assert.equal(calculateSavingsUSD(1420, DEFAULT_COMMERCIAL_API_RATE_PER_MIN), 8.52);
  assert.equal(calculateSavingsUSD(0), 0);
});

test('formatDuration handles mm:ss and hh:mm:ss properly', () => {
  assert.equal(formatDuration(0), '00:00');
  assert.equal(formatDuration(45), '00:45');
  assert.equal(formatDuration(872), '14:32');
  assert.equal(formatDuration(2538), '42:18');
  assert.equal(formatDuration(3665), '01:01:05');
});

test('formatTimestampSrt outputs correct comma separator and 3-digit millis', () => {
  assert.equal(formatTimestampSrt(15.25), '00:00:15,250');
  assert.equal(formatTimestampSrt(872.04), '00:14:32,040');
});

test('formatTimestampVtt outputs correct dot separator and 3-digit millis', () => {
  assert.equal(formatTimestampVtt(15.25), '00:00:15.250');
  assert.equal(formatTimestampVtt(872.04), '00:14:32.040');
});
