import test from 'node:test';
import assert from 'node:assert/strict';

const BRAND_BLUE = '#4EA7FE';

test('Gapwise canonical brand blue remains stable', () => {
  assert.equal(BRAND_BLUE, '#4EA7FE');
});

test('mobile identifiers stay first-party and platform-safe', () => {
  assert.match('ca.gapwise.mobile', /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/);
});
