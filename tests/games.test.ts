import test from 'node:test';
import assert from 'node:assert/strict';
import { getAllGames, getGameBySlug, evaluateGame } from '../src/utils/games.js';

test('getAllGames: strictly excludes fixtures and only includes real games', () => {
  const games = getAllGames();
  assert.ok(games.length >= 1);
  
  const slugs = games.map(g => g.slug);
  assert.ok(slugs.includes('eternal-return'));
  assert.ok(!slugs.includes('sample-fixture'), 'Fixtures must NEVER be loaded in production games list');
});

test('getGameBySlug: finds eternal-return and rejects fixture', () => {
  const er = getGameBySlug('eternal-return');
  assert.ok(er);
  assert.equal(er.slug, 'eternal-return');
  assert.equal(er.name, '이터널 리턴');

  const fixture = getGameBySlug('sample-fixture');
  assert.equal(fixture, undefined);
});

test('evaluateGame: properly partitions active and expired coupons', () => {
  const er = getGameBySlug('eternal-return');
  assert.ok(er);
  
  // Current time: 2026-09-06
  const evaluated = evaluateGame(er, new Date('2026-09-06T12:00:00+09:00'));
  assert.equal(evaluated.activeCount, 0);
  assert.equal(evaluated.activeCoupons.length, 0);
  assert.equal(evaluated.expiredCoupons.length, 4);
});
