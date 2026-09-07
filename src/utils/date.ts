export interface DateEvaluation {
  status: 'upcoming' | 'active' | 'expiring_today' | 'expired' | 'undetermined';
  dDayLabel: string;
  formattedExpiresAt: string;
  formattedStartsAt?: string;
}

export function getKSTDateParts(d: Date): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
} {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });

  const parts = formatter.formatToParts(d);
  const map: Record<string, number> = {};
  for (const part of parts) {
    if (part.type !== 'literal') {
      map[part.type] = parseInt(part.value, 10);
    }
  }

  return {
    year: map.year ?? 1970,
    month: map.month ?? 1,
    day: map.day ?? 1,
    hour: (map.hour === 24 ? 0 : map.hour) ?? 0,
    minute: map.minute ?? 0,
    second: map.second ?? 0,
  };
}

export function formatKSTDate(d: Date): string {
  const parts = getKSTDateParts(d);
  const mm = String(parts.month).padStart(2, '0');
  const dd = String(parts.day).padStart(2, '0');
  const hh = String(parts.hour).padStart(2, '0');
  const min = String(parts.minute).padStart(2, '0');
  return `${parts.year}.${mm}.${dd} ${hh}:${min}`;
}

export function evaluateCouponDate(
  expiresAt: string | null | undefined,
  referenceNow: Date = new Date(),
  startsAt?: string | null | undefined
): DateEvaluation {
  const nowMs = referenceNow.getTime();

  let formattedStartsAt: string | undefined;
  if (startsAt) {
    const startDate = new Date(startsAt);
    if (!isNaN(startDate.getTime())) {
      formattedStartsAt = formatKSTDate(startDate);
      const startMs = startDate.getTime();

      // If coupon has not started yet in KST
      if (startMs > nowMs) {
        const nowParts = getKSTDateParts(referenceNow);
        const startParts = getKSTDateParts(startDate);

        const nowMidnight = Date.UTC(nowParts.year, nowParts.month - 1, nowParts.day);
        const startMidnight = Date.UTC(startParts.year, startParts.month - 1, startParts.day);

        const diffStartDays = Math.round((startMidnight - nowMidnight) / (24 * 60 * 60 * 1000));

        let dDayLabel = '사용 예정';
        if (diffStartDays <= 0) {
          dDayLabel = '오늘 사용 가능';
        } else if (diffStartDays === 1) {
          dDayLabel = 'D-1부터 사용 가능';
        } else {
          dDayLabel = `D-${diffStartDays}부터 사용 가능`;
        }

        const formattedExpiresAt = expiresAt
          ? (isNaN(new Date(expiresAt).getTime()) ? expiresAt : formatKSTDate(new Date(expiresAt)))
          : '만료일 미정';

        return {
          status: 'upcoming',
          dDayLabel,
          formattedExpiresAt,
          formattedStartsAt,
        };
      }
    }
  }

  // If startsAt <= nowMs or not specified, evaluate expiration
  if (!expiresAt) {
    return {
      status: 'undetermined',
      dDayLabel: '만료일 미정',
      formattedExpiresAt: '만료일 미정',
      formattedStartsAt,
    };
  }

  const expiryDate = new Date(expiresAt);
  if (isNaN(expiryDate.getTime())) {
    return {
      status: 'undetermined',
      dDayLabel: '만료일 미정',
      formattedExpiresAt: expiresAt,
      formattedStartsAt,
    };
  }

  const formattedExpiresAt = formatKSTDate(expiryDate);
  const expiryMs = expiryDate.getTime();

  // If exact millisecond has already passed
  if (expiryMs <= nowMs) {
    return {
      status: 'expired',
      dDayLabel: '만료',
      formattedExpiresAt,
      formattedStartsAt,
    };
  }

  // Calculate calendar day difference in KST
  const nowParts = getKSTDateParts(referenceNow);
  const expParts = getKSTDateParts(expiryDate);

  const nowMidnight = Date.UTC(nowParts.year, nowParts.month - 1, nowParts.day);
  const expMidnight = Date.UTC(expParts.year, expParts.month - 1, expParts.day);

  const diffDays = Math.round((expMidnight - nowMidnight) / (24 * 60 * 60 * 1000));

  if (diffDays <= 0) {
    return {
      status: 'expiring_today',
      dDayLabel: '오늘 만료',
      formattedExpiresAt,
      formattedStartsAt,
    };
  }

  if (diffDays === 1) {
    return {
      status: 'active',
      dDayLabel: 'D-1',
      formattedExpiresAt,
      formattedStartsAt,
    };
  }

  return {
    status: 'active',
    dDayLabel: `D-${diffDays}`,
    formattedExpiresAt,
    formattedStartsAt,
  };
}
