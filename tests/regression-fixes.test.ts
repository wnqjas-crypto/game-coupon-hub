import test from 'node:test';
import assert from 'node:assert/strict';
import { getGameBySlug, getAllEvaluatedGames } from '../src/utils/games.js';

test('regression: eternal-return has 1 active coupon and correct lastUpdated date', () => {
  const er = getGameBySlug('eternal-return');
  assert.ok(er, 'eternal-return should exist');
  assert.equal(er.lastUpdated, '2026-09-07');

  const evaluatedGames = getAllEvaluatedGames(new Date('2026-09-07T12:00:00+09:00'));
  const evaluatedER = evaluatedGames.find(g => g.slug === 'eternal-return');
  assert.ok(evaluatedER);
  assert.equal(evaluatedER.activeCount, 1, 'Active coupon count in SSG evaluation must be exactly 1');
  assert.equal(evaluatedER.activeCoupons[0].code, 'GOS12SAILING');
  assert.equal(evaluatedER.lastUpdated, '2026-09-07');
});

test('regression: couponGuide in eternal-return does not have redundant leading step numbers', () => {
  const er = getGameBySlug('eternal-return');
  assert.ok(er);
  assert.ok(er.couponGuide && er.couponGuide.length > 0);

  for (const step of er.couponGuide) {
    // Must not start with digit + dot/space
    assert.match(step, /^[^\d]/, `Guide step "${step}" must not have leading step numbers since <ol> handles numbering`);
  }
});
