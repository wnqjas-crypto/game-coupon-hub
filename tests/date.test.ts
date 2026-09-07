import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateCouponDate, formatKSTDate } from '../src/utils/date.js';

test('evaluateCouponDate: null or empty returns undetermined', () => {
  const resultNull = evaluateCouponDate(null);
  assert.equal(resultNull.status, 'undetermined');
  assert.equal(resultNull.dDayLabel, '만료일 미정');

  const resultEmpty = evaluateCouponDate('');
  assert.equal(resultEmpty.status, 'undetermined');
  assert.equal(resultEmpty.dDayLabel, '만료일 미정');
});

test('evaluateCouponDate: already expired coupon', () => {
  // Reference now: 2026-09-06 14:00:00 KST
  const refNow = new Date('2026-09-06T05:00:00.000Z'); // 14:00 KST
  const pastCoupon = '2026-08-06T11:00:00+09:00';

  const result = evaluateCouponDate(pastCoupon, refNow);
  assert.equal(result.status, 'expired');
  assert.equal(result.dDayLabel, '만료');
  assert.equal(result.formattedExpiresAt, '2026.08.06 11:00');
});

test('evaluateCouponDate: expiring today', () => {
  // Reference now: 2026-09-06 14:00:00 KST
  const refNow = new Date('2026-09-06T05:00:00.000Z'); // 14:00 KST
  const todayCoupon = '2026-09-06T23:59:59+09:00';

  const result = evaluateCouponDate(todayCoupon, refNow);
  assert.equal(result.status, 'expiring_today');
  assert.equal(result.dDayLabel, '오늘 만료');
  assert.equal(result.formattedExpiresAt, '2026.09.06 23:59');
});

test('evaluateCouponDate: expiring tomorrow (D-1)', () => {
  // Reference now: 2026-09-06 14:00:00 KST
  const refNow = new Date('2026-09-06T05:00:00.000Z'); // 14:00 KST
  const tomorrowCoupon = '2026-09-07T23:59:59+09:00';

  const result = evaluateCouponDate(tomorrowCoupon, refNow);
  assert.equal(result.status, 'active');
  assert.equal(result.dDayLabel, 'D-1');
});

test('evaluateCouponDate: expiring in 4 days (D-4)', () => {
  // Reference now: 2026-09-06 14:00:00 KST
  const refNow = new Date('2026-09-06T05:00:00.000Z'); // 14:00 KST
  const futureCoupon = '2026-09-10T23:59:59+09:00';

  const result = evaluateCouponDate(futureCoupon, refNow);
  assert.equal(result.status, 'active');
  assert.equal(result.dDayLabel, 'D-4');
  assert.equal(result.formattedExpiresAt, '2026.09.10 23:59');
});

test('evaluateCouponDate: ISO 8601 +09:00 timestamp does not apply double offset', () => {
  // 11:00 KST with explicit +09:00 offset
  const kstCoupon = '2026-08-06T11:00:00+09:00';
  const ref = new Date('2026-08-01T00:00:00Z');
  const result = evaluateCouponDate(kstCoupon, ref);

  // If double offset was erroneously added, hour would be 20:00 instead of 11:00
  assert.equal(result.formattedExpiresAt, '2026.08.06 11:00');

  // UTC equivalent (02:00 UTC = 11:00 KST) must yield identical output
  const utcCoupon = '2026-08-06T02:00:00Z';
  const utcResult = evaluateCouponDate(utcCoupon, ref);
  assert.equal(utcResult.formattedExpiresAt, '2026.08.06 11:00');
  assert.equal(result.formattedExpiresAt, utcResult.formattedExpiresAt);
});

// === Requirements Case 1-8 for startsAt / upcoming ===

test('case 1: startsAt missing or null maintains existing active behavior', () => {
  const refNow = new Date('2026-09-07T12:00:00+09:00');
  const expiresAt = '2026-09-10T12:00:00+09:00';

  const resUndefined = evaluateCouponDate(expiresAt, refNow, undefined);
  assert.equal(resUndefined.status, 'active');
  assert.equal(resUndefined.dDayLabel, 'D-3');

  const resNull = evaluateCouponDate(expiresAt, refNow, null);
  assert.equal(resNull.status, 'active');
  assert.equal(resNull.dDayLabel, 'D-3');
});

test('case 2: 3 days before start time -> upcoming with D-3', () => {
  const refNow = new Date('2026-09-07T12:00:00+09:00');
  const startsAt = '2026-09-10T12:00:00+09:00';
  const expiresAt = '2026-11-10T23:59:59+09:00';

  const res = evaluateCouponDate(expiresAt, refNow, startsAt);
  assert.equal(res.status, 'upcoming');
  assert.equal(res.dDayLabel, 'D-3부터 사용 가능');
  assert.equal(res.formattedStartsAt, '2026.09.10 12:00');
});

test('case 3: 1 minute before start time -> upcoming', () => {
  // 11:59 KST, starts at 12:00 KST same day
  const refNow = new Date('2026-09-10T11:59:00+09:00');
  const startsAt = '2026-09-10T12:00:00+09:00';
  const expiresAt = '2026-11-10T23:59:59+09:00';

  const res = evaluateCouponDate(expiresAt, refNow, startsAt);
  assert.equal(res.status, 'upcoming');
  assert.equal(res.dDayLabel, '오늘 사용 가능');
});

test('case 4: exactly reaches start time -> active', () => {
  // Exactly 12:00:00 KST
  const refNow = new Date('2026-09-10T12:00:00+09:00');
  const startsAt = '2026-09-10T12:00:00+09:00';
  const expiresAt = '2026-11-10T23:59:59+09:00';

  const res = evaluateCouponDate(expiresAt, refNow, startsAt);
  assert.equal(res.status, 'active');
  assert.notEqual(res.status, 'upcoming');
});

test('case 5: after start time and before expiresAt -> active', () => {
  const refNow = new Date('2026-09-15T12:00:00+09:00');
  const startsAt = '2026-09-10T12:00:00+09:00';
  const expiresAt = '2026-11-10T23:59:59+09:00';

  const res = evaluateCouponDate(expiresAt, refNow, startsAt);
  assert.equal(res.status, 'active');
});

test('case 6: expiration day -> expiring_today', () => {
  const refNow = new Date('2026-11-10T10:00:00+09:00');
  const startsAt = '2026-09-10T12:00:00+09:00';
  const expiresAt = '2026-11-10T23:59:59+09:00';

  const res = evaluateCouponDate(expiresAt, refNow, startsAt);
  assert.equal(res.status, 'expiring_today');
  assert.equal(res.dDayLabel, '오늘 만료');
});

test('case 7: after expiresAt -> expired', () => {
  const refNow = new Date('2026-11-11T00:00:01+09:00');
  const startsAt = '2026-09-10T12:00:00+09:00';
  const expiresAt = '2026-11-10T23:59:59+09:00';

  const res = evaluateCouponDate(expiresAt, refNow, startsAt);
  assert.equal(res.status, 'expired');
  assert.equal(res.dDayLabel, '만료');
});

test('case 8: startsAt with +09:00 offset does not apply double offset', () => {
  const startsAt = '2026-09-10T12:00:00+09:00';
  const refNow = new Date('2026-09-01T00:00:00Z');

  const res = evaluateCouponDate('2026-11-10T23:59:59+09:00', refNow, startsAt);
  assert.equal(res.formattedStartsAt, '2026.09.10 12:00');
});
