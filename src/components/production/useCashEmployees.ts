import { useCallback, useEffect, useState } from 'react';
import { authenticatedFetchNoCreds } from '@/lib/api';
import { getCurrentPeriod, type Period } from '@/utils/periodUtils';
import { RATE_OFFSET } from '@/lib/constants';
import funcUrls from '../../../backend/func2url.json';

const urls = funcUrls as Record<string, string>;

export interface CashEmployee {
  email: string;
  name: string;
  role: string;
  salary: number;
  base: number;
  expenses: number;
  advance: number;
  penalty: number;
  bonus: number;
}

interface Adjustment {
  advance?: number;
  penalty?: number;
  expenses?: number;
}

const formatDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

interface ApiUser {
  email: string;
  fullName?: string;
  role: string;
  isActive?: boolean;
}

interface Assignment {
  producerEmail?: string;
  modelEmail?: string | null;
  operatorEmail?: string | null;
}

interface SalaryEntry {
  total?: number;
}

export const useCashEmployees = (viewerEmail: string, viewerRole: string, period?: Period) => {
  const [employees, setEmployees] = useState<CashEmployee[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const range = period || getCurrentPeriod();
      const start = formatDate(range.startDate);
      const end = formatDate(range.endDate);
      const isProducer = viewerRole === 'producer';

      const [usersRes, salariesRes, rateRes, assignRes, adjRes] = await Promise.all([
        authenticatedFetchNoCreds(urls['auth']),
        authenticatedFetchNoCreds(
          `${urls['calculate-salaries']}?period_start=${start}&period_end=${end}`,
        ),
        authenticatedFetchNoCreds(urls['cbr-rate']),
        isProducer
          ? authenticatedFetchNoCreds(
              `${urls['producer-assignments']}?producer=${encodeURIComponent(viewerEmail)}`,
            )
          : Promise.resolve(null),
        authenticatedFetchNoCreds(
          `${urls['salary-adjustments']}?period_start=${start}&period_end=${end}`,
        ).catch(() => null),
      ]);

      const users: ApiUser[] = await usersRes.json();
      const salaries = await salariesRes.json();
      const rateData = await rateRes.json();
      const rate = (rateData?.rate || 0) - RATE_OFFSET;
      const adjustments: Record<string, Adjustment> = adjRes ? await adjRes.json() : {};

      const self = (viewerEmail || '').toLowerCase();

      let allowed: string[] | null = null;
      if (isProducer && assignRes) {
        const assignments: Assignment[] = await assignRes.json();
        allowed = Array.isArray(assignments)
          ? assignments
              .flatMap((a) => [a.modelEmail, a.operatorEmail])
              .filter((e): e is string => Boolean(e))
              .map((e) => e.toLowerCase())
          : [];
        allowed.push(self);
      }

      const salaryOf = (email: string, role: string): number => {
        const bucket =
          role === 'operator'
            ? salaries?.operators
            : role === 'producer'
              ? salaries?.producers
              : role === 'director'
                ? salaries?.directors
                : salaries?.models;
        const entry: SalaryEntry | undefined = bucket?.[email];
        const dollars = Number(entry?.total || 0);
        return Math.round(dollars * rate);
      };

      const list = (Array.isArray(users) ? users : [])
        .filter((u) => u.isActive !== false)
        .filter(
          (u) =>
            ['operator', 'content_maker', 'solo_maker', 'model'].includes(u.role) ||
            u.email.toLowerCase() === self,
        )
        .filter((u) => !allowed || allowed.includes(u.email.toLowerCase()))
        .map((u) => {
          const base = salaryOf(u.email, u.role);
          const adj = adjustments[u.email] || {};
          return {
            email: u.email,
            name: u.fullName || u.email,
            role: u.role,
            base,
            expenses: Number(adj.expenses || 0),
            advance: Number(adj.advance || 0),
            penalty: Number(adj.penalty || 0),
            bonus: 0,
            salary: 0,
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name, 'ru'));

      const bonuses = await Promise.all(
        list.map((e) =>
          authenticatedFetchNoCreds(
            `${urls['earned-bonuses']}?user_email=${encodeURIComponent(e.email)}&period_start=${start}&period_end=${end}`,
          )
            .then((r) => r.json())
            .then((d) => Number(d?.total || 0))
            .catch(() => 0),
        ),
      );

      list.forEach((e, i) => {
        e.bonus = bonuses[i];
        e.salary = Math.round(e.base + e.expenses - e.advance - e.penalty + e.bonus);
      });

      setEmployees(list);
    } catch {
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, [viewerEmail, viewerRole, period?.startDate?.getTime(), period?.endDate?.getTime()]);

  useEffect(() => {
    load();
  }, [load]);

  return { employees, loading };
};

export default useCashEmployees;
