import test from 'node:test';
import assert from 'node:assert/strict';
import { getAllGames, getGameBySlug, evaluateGame } from '../src/utils/games.js';

test('getAllGames: strictly excludes fixtures and includes real games', () => {
  const games = getAllGames();
  assert.ok(games.length >= 2);
  
  const slugs = games.map(g => g.slug);
  assert.ok(slugs.includes('eternal-return'));
  assert.ok(slugs.includes('eclipse-the-awakening'));
  assert.ok(!slugs.includes('sample-fixture'), 'Fixtures must NEVER be loaded in production games list');
});

test('getGameBySlug: finds eternal-return and eclipse-the-awakening, rejects fixture', () => {
  const er = getGameBySlug('eternal-return');
  assert.ok(er);
  assert.equal(er.slug, 'eternal-return');
  assert.equal(er.name, '이터널 리턴');

  const ec = getGameBySlug('eclipse-the-awakening');
  assert.ok(ec);
  assert.equal(ec.slug, 'eclipse-the-awakening');
  assert.equal(ec.name, '이클립스: 더 어웨이크닝');
  assert.equal(ec.officialName, 'Eclipse: The Awakening');

  const fixture = getGameBySlug('sample-fixture');
  assert.equal(fixture, undefined);
});

test('evaluateGame: properly partitions upcoming, active, and expired coupons', () => {
  const er = getGameBySlug('eternal-return');
  assert.ok(er);
  
  // Current time: 2026-09-07
  const evaluated = evaluateGame(er, new Date('2026-09-07T12:00:00+09:00'));
  assert.equal(evaluated.activeCount, 1);
  assert.equal(evaluated.activeCoupons.length, 1);
  assert.equal(evaluated.activeCoupons[0].code, 'GOS12SAILING');
  assert.equal(evaluated.expiredCoupons.length, 4);

  // Case 9: On 2026-09-07, Eclipse 0910ECLIPSE starts at 2026-09-10 12:00 KST
  // It MUST be in upcomingCoupons and EXCLUDED from activeCoupons and activeCount
  const ec = getGameBySlug('eclipse-the-awakening');
  assert.ok(ec);
  const evaluatedEcBeforeLaunch = evaluateGame(ec, new Date('2026-09-07T12:00:00+09:00'));
  assert.equal(evaluatedEcBeforeLaunch.activeCount, 0, 'Upcoming coupon must not be counted in activeCount');
  assert.equal(evaluatedEcBeforeLaunch.activeCoupons.length, 0);
  assert.equal(evaluatedEcBeforeLaunch.upcomingCount, 1);
  assert.equal(evaluatedEcBeforeLaunch.upcomingCoupons.length, 1);
  assert.equal(evaluatedEcBeforeLaunch.upcomingCoupons[0].code, '0910ECLIPSE');

  // Once launch time arrives (2026-09-10 12:00:00 KST), it transitions to active
  const evaluatedEcAtLaunch = evaluateGame(ec, new Date('2026-09-10T12:00:00+09:00'));
  assert.equal(evaluatedEcAtLaunch.activeCount, 1);
  assert.equal(evaluatedEcAtLaunch.activeCoupons[0].code, '0910ECLIPSE');
  assert.equal(evaluatedEcAtLaunch.upcomingCount, 0);

  // Test 0 active and 0 upcoming coupons state
  const zeroCouponGame = { ...ec, coupons: [] };
  const evaluatedZero = evaluateGame(zeroCouponGame);
  assert.equal(evaluatedZero.activeCount, 0);
  assert.equal(evaluatedZero.upcomingCount, 0);
  assert.equal(evaluatedZero.activeCoupons.length, 0);
});
