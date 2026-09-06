export interface CouponItem {
  code: string;
  reward: string;
  issuedAt?: string;
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

export type CouponStatus = 'active' | 'expiring_today' | 'expired' | 'undetermined';

export interface EvaluatedCoupon extends CouponItem {
  status: CouponStatus;
  dDayLabel: string;
  formattedExpiresAt: string;
}

export interface EvaluatedGameData extends Omit<GameData, 'coupons'> {
  activeCoupons: EvaluatedCoupon[];
  expiredCoupons: EvaluatedCoupon[];
  activeCount: number;
}
