import { useEffect, useState } from 'react';
import funcUrls from '../../backend/func2url.json';

const EARNED_BONUSES_URL = (funcUrls as Record<string, string>)['earned-bonuses'];

export interface EarnedBonus {
  id: number;
  amount: number;
  reason: string;
  period_start: string;
  period_end: string;
}

const formatIsoDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/**
 * Возвращает зафиксированную премию сотрудника за конкретный период.
 * Если премии нет — bonus = null.
 */
export function useEarnedBonus(userEmail: string | undefined, periodStart?: Date | string, periodEnd?: Date | string) {
  const [bonus, setBonus] = useState<EarnedBonus | null>(null);
  const [loading, setLoading] = useState(false);

  const startStr = periodStart instanceof Date ? formatIsoDate(periodStart) : (periodStart || '');
  const endStr = periodEnd instanceof Date ? formatIsoDate(periodEnd) : (periodEnd || '');

  useEffect(() => {
    if (!userEmail || !startStr || !endStr || !EARNED_BONUSES_URL) {
      setBonus(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const url = `${EARNED_BONUSES_URL}?user_email=${encodeURIComponent(userEmail)}&period_start=${startStr}&period_end=${endStr}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data && Array.isArray(data.bonuses) && data.bonuses.length > 0) {
          setBonus(data.bonuses[0]);
        } else {
          setBonus(null);
        }
      })
      .catch(() => {
        if (!cancelled) setBonus(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userEmail, startStr, endStr]);

  return { bonus, loading };
}
