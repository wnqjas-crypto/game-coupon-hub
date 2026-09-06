import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateCouponDate } from '../src/utils/date.js';

test('client reclassification logic: transitioning from active to expired when time advances', () => {
  const couponExpiresAt = '2026-09-07T12:00:00+09:00';
  
  // At build time: 2026-09-06 (active D-1)
  const buildTime = new Date('2026-09-06T12:00:00+09:00');
  const buildEval = evaluateCouponDate(couponExpiresAt, buildTime);
  assert.equal(buildEval.status, 'active');
  assert.equal(buildEval.dDayLabel, 'D-1');

  // At client load time: 2026-09-08 (now expired)
  const clientTime = new Date('2026-09-08T12:00:00+09:00');
  const clientEval = evaluateCouponDate(couponExpiresAt, clientTime);
  assert.equal(clientEval.status, 'expired');
  assert.equal(clientEval.dDayLabel, '만료');
});

test('home reclassification logic: game active coupon count accurately recalculates without site rebuild', () => {
  // Game with 2 coupons: one expires 2026-09-07 10:00 KST, another expires 2026-09-15 10:00 KST
  const couponExpiries = [
    '2026-09-07T10:00:00+09:00',
    '2026-09-15T10:00:00+09:00'
  ];

  // Helper simulating the home page client script
  function calculateActiveCount(expiries: (string | null)[], nowMs: number): number {
    let count = 0;
    for (const exp of expiries) {
      if (!exp) {
        count++;
        continue;
      }
      const time = new Date(exp).getTime();
      if (!isNaN(time) && time > nowMs) {
        count++;
      }
    }
    return count;
  }

  // 1. On build day: 2026-09-06 -> Both coupons are active (count = 2)
  const buildTimeMs = new Date('2026-09-06T12:00:00+09:00').getTime();
  assert.equal(calculateActiveCount(couponExpiries, buildTimeMs), 2);

  // 2. On 2026-09-08 -> First coupon expired, second still active (count drops to 1 without rebuild)
  const dayTwoMs = new Date('2026-09-08T12:00:00+09:00').getTime();
  assert.equal(calculateActiveCount(couponExpiries, dayTwoMs), 1);

  // 3. On 2026-09-16 -> Both coupons expired (count drops to 0 without rebuild)
  const dayThreeMs = new Date('2026-09-16T12:00:00+09:00').getTime();
  assert.equal(calculateActiveCount(couponExpiries, dayThreeMs), 0);
});
