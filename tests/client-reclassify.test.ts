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

test('case 10: client reclassification logic transitions from upcoming -> active -> expired as time advances', () => {
  const startsAt = '2026-09-10T12:00:00+09:00';
  const expiresAt = '2026-11-10T23:59:59+09:00';

  // 1. Before launch: 2026-09-07 -> upcoming
  const timeBeforeLaunch = new Date('2026-09-07T12:00:00+09:00');
  const evalUpcoming = evaluateCouponDate(expiresAt, timeBeforeLaunch, startsAt);
  assert.equal(evalUpcoming.status, 'upcoming');
  assert.equal(evalUpcoming.dDayLabel, 'D-3부터 사용 가능');

  // 2. Launch reached: 2026-09-10 12:00:00 -> transitions to active
  const timeLaunch = new Date('2026-09-10T12:00:00+09:00');
  const evalActive = evaluateCouponDate(expiresAt, timeLaunch, startsAt);
  assert.equal(evalActive.status, 'active');
  assert.equal(evalActive.dDayLabel, 'D-61');

  // 3. After expiry: 2026-11-11 -> transitions to expired
  const timeExpired = new Date('2026-11-11T00:00:01+09:00');
  const evalExpired = evaluateCouponDate(expiresAt, timeExpired, startsAt);
  assert.equal(evalExpired.status, 'expired');
  assert.equal(evalExpired.dDayLabel, '만료');
});

test('home reclassification logic: game active coupon count accurately recalculates without site rebuild', () => {
  // Game with 2 coupons: one upcoming until 2026-09-10 12:00, one active expiring 2026-09-15 10:00
  const couponSchedules = [
    { startsAt: '2026-09-10T12:00:00+09:00', expiresAt: '2026-11-10T23:59:59+09:00' },
    { startsAt: null, expiresAt: '2026-09-15T10:00:00+09:00' }
  ];

  // Helper simulating the home page client script
  function calculateHomeCounts(schedules: { startsAt: string | null; expiresAt: string | null }[], nowMs: number) {
    let activeCount = 0;
    let upcomingCount = 0;

    schedules.forEach((item) => {
      const startTime = item.startsAt ? new Date(item.startsAt).getTime() : NaN;
      const expiryTime = item.expiresAt ? new Date(item.expiresAt).getTime() : NaN;

      if (!isNaN(startTime) && startTime > nowMs) {
        upcomingCount++;
        return;
      }

      if (isNaN(expiryTime) || expiryTime > nowMs) {
        activeCount++;
      }
    });

    return { activeCount, upcomingCount };
  }

  // 1. On 2026-09-07 -> 1 upcoming, 1 active
  const t1 = new Date('2026-09-07T12:00:00+09:00').getTime();
  const counts1 = calculateHomeCounts(couponSchedules, t1);
  assert.equal(counts1.activeCount, 1);
  assert.equal(counts1.upcomingCount, 1);

  // 2. On 2026-09-10 12:01 -> upcoming coupon transitioned to active! (2 active, 0 upcoming)
  const t2 = new Date('2026-09-10T12:01:00+09:00').getTime();
  const counts2 = calculateHomeCounts(couponSchedules, t2);
  assert.equal(counts2.activeCount, 2);
  assert.equal(counts2.upcomingCount, 0);

  // 3. On 2026-09-16 -> Second coupon expired (1 active left)
  const t3 = new Date('2026-09-16T12:00:00+09:00').getTime();
  const counts3 = calculateHomeCounts(couponSchedules, t3);
  assert.equal(counts3.activeCount, 1);
  assert.equal(counts3.upcomingCount, 0);
});
