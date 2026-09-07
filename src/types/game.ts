export interface CouponItem {
  code: string;
  reward: string;
  issuedAt?: string;
  startsAt?: string | null;
  expiresAt: string | null;
  sourceUrl: string;
  notes?: string;
}

export interface GameData {
  slug: string;
  name: string;
  officialName: string;
  icon: string;
  officialUrl: string;
  couponGuide: string[];
  lastUpdated: string;
  coupons: CouponItem[];
}

export type CouponStatus = 'upcoming' | 'active' | 'expiring_today' | 'expired' | 'undetermined';

export interface EvaluatedCoupon extends CouponItem {
  status: CouponStatus;
  dDayLabel: string;
  formattedExpiresAt: string;
  formattedStartsAt?: string;
}

export interface EvaluatedGameData extends Omit<GameData, 'coupons'> {
  upcomingCoupons: EvaluatedCoupon[];
  activeCoupons: EvaluatedCoupon[];
  expiredCoupons: EvaluatedCoupon[];
  activeCount: number;
  upcomingCount: number;
}
