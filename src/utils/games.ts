import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { GameData, EvaluatedGameData, EvaluatedCoupon } from '../types/game.js';
import { evaluateCouponDate } from './date.js';

interface JsonModule {
  default: GameData;
}

export function getAllGames(): GameData[] {
  const games: GameData[] = [];

  try {
    // Vite statically analyzes and replaces import.meta.glob(...)
    const modules = import.meta.glob<JsonModule>('../data/games/*.json', { eager: true });
    for (const p in modules) {
      const mod = modules[p] as any;
      const data = mod.default || mod;
      if (data && data.slug) {
        games.push(data);
      }
    }
    if (games.length > 0) {
      return games;
    }
  } catch {
    // Fallback for tsx / pure Node environment
  }

  try {
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    const gamesDir = path.resolve(currentDir, '../data/games');
    if (fs.existsSync(gamesDir)) {
      const files = fs.readdirSync(gamesDir).filter((f) => f.endsWith('.json'));
      for (const file of files) {
        const filePath = path.join(gamesDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(content);
        if (data && data.slug) {
          games.push(data);
        }
      }
    }
  } catch (err) {
    console.error('Error loading fallback games:', err);
  }

  return games;
}

export function getGameBySlug(slug: string): GameData | undefined {
  const games = getAllGames();
  return games.find((g) => g.slug === slug);
}

export function evaluateGame(game: GameData, referenceNow: Date = new Date()): EvaluatedGameData {
  const activeCoupons: EvaluatedCoupon[] = [];
  const expiredCoupons: EvaluatedCoupon[] = [];

  for (const coupon of game.coupons || []) {
    const evaluation = evaluateCouponDate(coupon.expiresAt, referenceNow);
    const evaluated: EvaluatedCoupon = {
      ...coupon,
      status: evaluation.status,
      dDayLabel: evaluation.dDayLabel,
      formattedExpiresAt: evaluation.formattedExpiresAt,
    };

    if (evaluation.status === 'expired') {
      expiredCoupons.push(evaluated);
    } else {
      activeCoupons.push(evaluated);
    }
  }

  return {
    slug: game.slug,
    name: game.name,
    officialName: game.officialName,
    icon: game.icon,
    officialUrl: game.officialUrl,
    couponGuide: game.couponGuide,
    lastUpdated: game.lastUpdated,
    activeCoupons,
    expiredCoupons,
    activeCount: activeCoupons.length,
  };
}

export function getAllEvaluatedGames(referenceNow: Date = new Date()): EvaluatedGameData[] {
  return getAllGames()
    .map((g) => evaluateGame(g, referenceNow))
    .sort((a, b) => {
      if (b.activeCount !== a.activeCount) {
        return b.activeCount - a.activeCount;
      }
      return b.lastUpdated.localeCompare(a.lastUpdated);
    });
}
