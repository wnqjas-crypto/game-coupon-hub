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
