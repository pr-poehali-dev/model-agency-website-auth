import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch } from '@/lib/api';
import { getCurrentPeriod, getPreviousPeriod, getNextPeriod, type Period } from '@/utils/periodUtils';
import funcUrls from '../../backend/func2url.json';

const USERS_API_URL = 'https://functions.poehali.dev/67fd6902-6170-487e-bb46-f6d14ec99066';
const SHIFT_PROGRESS_URL = (funcUrls as Record<string, string>)['shift-progress'];
const PRODUCER_PLANS_URL = (funcUrls as Record<string, string>)['producer-plans'];

interface User {
  email: string;
  role: string;
  full_name?: string;
}

interface ProducerRow {
  email: string;
  name: string;
  loading: boolean;
  saving: boolean;
  inputValue: string;
  models_assigned: number;
  shifts_count: number;
  shifts_target: number;
  shifts_ready: boolean;
  income_fact: number;
  income_plan: number;
  income_ready: boolean;
  bonus_ready: boolean;
}

const formatIsoDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

interface Props {
  currentUserEmail: string;
  currentUserRole: string;
}

const ProducerPlansManager = ({ currentUserEmail, currentUserRole }: Props) => {
  const [period, setPeriod] = useState<Period>(() => getCurrentPeriod());
  const [rows, setRows] = useState<ProducerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const isDirector = currentUserRole === 'director';

  useEffect(() => {
    if (!isDirector) return;
    loadAll();
  }, [period, isDirector]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const usersResp = await authenticatedFetch(USERS_API_URL);
      if (!usersResp.ok) {
        toast({ title: 'Ошибка загрузки пользователей', variant: 'destructive' });
        setLoading(false);
        return;
      }
      const users: User[] = await usersResp.json();
      const producers = users.filter((u) => u.role === 'producer');

      const periodStart = formatIsoDate(period.startDate);
      const periodEnd = formatIsoDate(period.endDate);

      const results: ProducerRow[] = await Promise.all(
        producers.map(async (p) => {
          const row: ProducerRow = {
            email: p.email,
            name: p.full_name || p.email,
            loading: false,
            saving: false,
            inputValue: '',
            models_assigned: 0,
            shifts_count: 0,
            shifts_target: 0,
            shifts_ready: false,
            income_fact: 0,
            income_plan: 0,
            income_ready: false,
            bonus_ready: false,
          };
          try {
            const url = `${SHIFT_PROGRESS_URL}?user_email=${encodeURIComponent(p.email)}&role=producer&period_start=${periodStart}&period_end=${periodEnd}`;
            const r = await fetch(url);
            const data = await r.json();
            if (data && typeof data.shifts_count === 'number') {
              row.models_assigned = data.models_assigned || 0;
              row.shifts_count = data.shifts_count || 0;
              row.shifts_target = data.target || 0;
              row.shifts_ready = !!data.shifts_ready;
              row.income_fact = data.income_fact || 0;
              row.income_plan = data.income_plan || 0;
              row.income_ready = !!data.income_ready;
              row.bonus_ready = !!data.bonus_ready;
              row.inputValue = data.income_plan ? String(data.income_plan) : '';
            }
          } catch {
            // ignore
          }
          return row;
        })
      );

      setRows(results);
    } finally {
      setLoading(false);
    }
  };

  const updateRow = (email: string, patch: Partial<ProducerRow>) => {
    setRows((prev) => prev.map((r) => (r.email === email ? { ...r, ...patch } : r)));
  };

  const savePlan = async (row: ProducerRow) => {
    const amount = parseFloat(row.inputValue);
    if (isNaN(amount) || amount < 0) {
      toast({ title: 'Введите корректную сумму', variant: 'destructive' });
      return;
    }
    updateRow(row.email, { saving: true });
    try {
      const resp = await fetch(PRODUCER_PLANS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          producer_email: row.email,
          period_start: formatIsoDate(period.startDate),
          period_end: formatIsoDate(period.endDate),
          plan_amount: amount,
          set_by_email: currentUserEmail,
          user_role: currentUserRole,
        }),
      });
      const data = await resp.json();
      if (resp.ok) {
        toast({ title: 'План сохранён' });
        const incomeReady = amount > 0 && row.income_fact >= amount;
        updateRow(row.email, {
          income_plan: amount,
          income_ready: incomeReady,
          bonus_ready: row.shifts_ready && incomeReady,
          saving: false,
        });
      } else {
        toast({ title: data.error || 'Ошибка сохранения', variant: 'destructive' });
        updateRow(row.email, { saving: false });
      }
    } catch {
      toast({ title: 'Ошибка соединения', variant: 'destructive' });
      updateRow(row.email, { saving: false });
    }
  };

  if (!isDirector) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Эта страница доступна только директору.
      </div>
    );
  }

  const pctShifts = (r: ProducerRow) =>
    r.shifts_target > 0 ? Math.min(100, (r.shifts_count / r.shifts_target) * 100) : 0;
  const pctIncome = (r: ProducerRow) =>
    r.income_plan > 0 ? Math.min(100, (r.income_fact / r.income_plan) * 100) : 0;

  const totalProducers = rows.length;
  const bonusReadyCount = rows.filter((r) => r.bonus_ready).length;
  const shiftsReadyCount = rows.filter((r) => r.shifts_ready).length;
  const incomeReadyCount = rows.filter((r) => r.income_ready).length;
  const totalBonusRub = bonusReadyCount * 5000;

  return (
    <div className="animate-fade-in space-y-4">
      <Card className="border-border/50 bg-secondary/30 backdrop-blur-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-foreground font-heading">
              <Icon name="Target" size={20} className="text-primary" />
              Планы продюсеров по доходу
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setPeriod(getPreviousPeriod(period))}
              >
                <Icon name="ChevronLeft" size={16} />
              </Button>
              <span className="text-sm text-muted-foreground min-w-[120px] text-center">
                {period.label}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setPeriod(getNextPeriod(period))}
              >
                <Icon name="ChevronRight" size={16} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!loading && rows.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <div className="rounded-lg border border-border/50 bg-background/40 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Icon name="Users" size={14} />
                  Всего продюсеров
                </div>
                <div className="text-2xl font-bold text-foreground">{totalProducers}</div>
              </div>

              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Icon name="CalendarCheck" size={14} className="text-emerald-500" />
                  Выполнили смены
                </div>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {shiftsReadyCount} / {totalProducers}
                </div>
              </div>

              <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Icon name="TrendingUp" size={14} className="text-purple-500" />
                  Выполнили план $
                </div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {incomeReadyCount} / {totalProducers}
                </div>
              </div>

              <div className="rounded-lg border border-amber-500/40 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Icon name="Award" size={14} className="text-amber-500" />
                  Получили премию
                </div>
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {bonusReadyCount} / {totalProducers}
                </div>
                {totalBonusRub > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Сумма: {totalBonusRub.toLocaleString('ru-RU')} ₽
                  </div>
                )}
              </div>
            </div>
          )}

          {loading ? (
            <div className="py-10 text-center text-muted-foreground">Загрузка...</div>
          ) : rows.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">Продюсеров нет</div>
          ) : (
            <div className="space-y-3">
              {rows.map((row) => (
                <div
                  key={row.email}
                  className={`rounded-lg border p-4 transition-colors ${
                    row.bonus_ready
                      ? 'border-green-500/40 bg-green-500/5'
                      : 'border-border/50 bg-background/40'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-foreground truncate">{row.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {row.email} · {row.models_assigned} моделей
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm text-muted-foreground">План $</span>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={row.inputValue}
                        onChange={(e) => updateRow(row.email, { inputValue: e.target.value })}
                        className="w-32 h-9"
                        placeholder="0"
                      />
                      <Button
                        size="sm"
                        onClick={() => savePlan(row)}
                        disabled={row.saving}
                      >
                        {row.saving ? '...' : 'Сохранить'}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Смены</span>
                        <span className="font-semibold text-foreground">
                          {row.shifts_count} / {row.shifts_target}
                        </span>
                      </div>
                      <Progress
                        value={pctShifts(row)}
                        className={row.shifts_ready ? '[&>div]:bg-green-500' : ''}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Доход на продакшн</span>
                        <span className="font-semibold text-foreground">
                          ${row.income_fact.toFixed(0)} / ${row.income_plan.toFixed(0)}
                        </span>
                      </div>
                      <Progress
                        value={pctIncome(row)}
                        className={row.income_ready ? '[&>div]:bg-green-500' : '[&>div]:bg-purple-500'}
                      />
                    </div>
                  </div>

                  <p
                    className={`text-xs mt-2 font-semibold ${
                      row.bonus_ready ? 'text-green-500' : 'text-muted-foreground/60'
                    }`}
                  >
                    Премия 5000 руб.
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProducerPlansManager;