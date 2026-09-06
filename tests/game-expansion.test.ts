import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getAllGames, getGameBySlug } from '../src/utils/games.js';

test('game expansion: adding a new game JSON dynamically adds it to the system', () => {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const tempGamePath = path.resolve(currentDir, '../src/data/games/temp-test-game.json');

  try {
    const dummyGame = {
      slug: 'temp-test-game',
      name: '임시 추가 테스트 게임',
      officialName: 'Temp Test Game',
      icon: '/games/temp.svg',
      officialUrl: 'https://example.com',
      couponGuide: ['1단계', '2단계'],
      lastUpdated: '2026-09-06',
      coupons: []
    };

    fs.writeFileSync(tempGamePath, JSON.stringify(dummyGame, null, 2), 'utf-8');

    const games = getAllGames();
    const found = games.find(g => g.slug === 'temp-test-game');
    assert.ok(found, 'New game JSON should be automatically discovered without code modifications');
    assert.equal(found?.name, '임시 추가 테스트 게임');

    const bySlug = getGameBySlug('temp-test-game');
    assert.ok(bySlug);
  } finally {
    if (fs.existsSync(tempGamePath)) {
      fs.unlinkSync(tempGamePath);
    }
  }
});
