import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { getCurrentPeriod, getPreviousPeriod, getNextPeriod, type Period } from '@/utils/periodUtils';
import { authenticatedFetchNoCreds } from '@/lib/api';
import funcUrls from '../../backend/func2url.json';

const SHIFT_PROGRESS_URL = (funcUrls as Record<string, string>)['shift-progress'];
const PLANS_URL = (funcUrls as Record<string, string>)['producer-plans'];

const DEFAULT_BONUS = 5000;

const ROLE_LABELS: Record<string, string> = {
  producer: 'Продюсер',
  operator: 'Оператор',
  content_maker: 'Контент-мейкер',
};

interface EmployeeRow {
  email: string;
  name: string;
  role: string;
  saving: boolean;
  planType: 'income' | 'shifts';
  planInput: string;
  bonusInput: string;
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
  const [rows, setRows] = useState<EmployeeRow[]>([]);
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
      const periodStart = formatIsoDate(period.startDate);
      const periodEnd = formatIsoDate(period.endDate);

      const plansResp = await authenticatedFetchNoCreds(
        `${PLANS_URL}?period_start=${periodStart}&period_end=${periodEnd}`
      );
      if (!plansResp.ok) {
        toast({ title: 'Не удалось загрузить сотрудников', variant: 'destructive' });
        setRows([]);
        return;
      }
      const plansData = await plansResp.json();
      const employees = Array.isArray(plansData.employees) ? plansData.employees : [];

      const results: EmployeeRow[] = await Promise.all(
        employees.map(async (emp: Record<string, unknown>) => {
          const email = String(emp.email);
          const role = String(emp.role);
          const row: EmployeeRow = {
            email,
            name: String(emp.full_name || email),
            role,
            saving: false,
            planType: (emp.plan_type as 'income' | 'shifts') || (role === 'producer' ? 'income' : 'shifts'),
            planInput: Number(emp.plan_amount) > 0 ? String(Number(emp.plan_amount)) : '',
            bonusInput: String(Number(emp.bonus_amount) || DEFAULT_BONUS),
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
            const url = `${SHIFT_PROGRESS_URL}?user_email=${encodeURIComponent(email)}&role=${encodeURIComponent(role)}&period_start=${periodStart}&period_end=${periodEnd}`;
            const r = await authenticatedFetchNoCreds(url);
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
            }
          } catch {
            // данные прогресса недоступны — строка останется с нулями
          }
          return row;
        })
      );

      setRows(results);
    } finally {
      setLoading(false);
    }
  };

  const updateRow = (email: string, patch: Partial<EmployeeRow>) => {
    setRows((prev) => prev.map((r) => (r.email === email ? { ...r, ...patch } : r)));
  };

  const savePlan = async (row: EmployeeRow) => {
    const amount = parseFloat(row.planInput);
    const bonus = parseFloat(row.bonusInput);
    if (isNaN(amount) || amount < 0) {
      toast({ title: 'Введите корректный план', variant: 'destructive' });
      return;
    }
    if (isNaN(bonus) || bonus < 0) {
      toast({ title: 'Введите корректную премию', variant: 'destructive' });
      return;
    }
    updateRow(row.email, { saving: true });
    try {
      const resp = await authenticatedFetchNoCreds(PLANS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: row.email,
          period_start: formatIsoDate(period.startDate),
          period_end: formatIsoDate(period.endDate),
          plan_type: row.planType,
          plan_amount: amount,
          bonus_amount: bonus,
          set_by_email: currentUserEmail,
          user_role: currentUserRole,
        }),
      });
      const data = await resp.json();
      if (resp.ok) {
        toast({ title: 'План сохранён' });
        updateRow(row.email, { saving: false });
        loadAll();
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

  const progressPct = (r: EmployeeRow) => {
    if (r.planType === 'shifts') {
      return r.shifts_target > 0 ? Math.min(100, (r.shifts_count / r.shifts_target) * 100) : 0;
    }
    return r.income_plan > 0 ? Math.min(100, (r.income_fact / r.income_plan) * 100) : 0;
  };

  const producerRows = rows.filter((r) => r.role === 'producer');
  const staffRows = rows.filter((r) => r.role !== 'producer');

  const sumBonus = (list: EmployeeRow[]) =>
    list.filter((r) => r.bonus_ready).reduce((sum, r) => sum + (parseFloat(r.bonusInput) || 0), 0);

  const renderCard = (row: EmployeeRow) => (
    <div
      key={row.email}
      className={`rounded-lg border p-4 transition-colors ${
        row.bonus_ready ? 'border-green-500/40 bg-green-500/5' : 'border-border/50 bg-background/40'
      }`}
    >
      <div className="flex flex-col gap-3 mb-3">
        <div className="min-w-0">
          <div className="font-semibold text-foreground truncate">{row.name}</div>
          <div className="text-xs text-muted-foreground truncate">
            {ROLE_LABELS[row.role] || row.role}
            {row.models_assigned > 0 && ` · ${row.models_assigned} моделей`}
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Тип плана</span>
            <div className="flex rounded-md border border-border/60 overflow-hidden">
              <button
                type="button"
                onClick={() => updateRow(row.email, { planType: 'income' })}
                className={`px-3 h-9 text-xs font-medium transition-colors ${
                  row.planType === 'income'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background text-muted-foreground hover:bg-muted'
                }`}
              >
                Доход $
              </button>
              <button
                type="button"
                onClick={() => updateRow(row.email, { planType: 'shifts' })}
                className={`px-3 h-9 text-xs font-medium transition-colors ${
                  row.planType === 'shifts'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background text-muted-foreground hover:bg-muted'
                }`}
              >
                Смены
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">
              {row.planType === 'income' ? 'План, $' : 'План, смен'}
            </span>
            <Input
              type="number"
              min="0"
              step="1"
              value={row.planInput}
              onChange={(e) => updateRow(row.email, { planInput: e.target.value })}
              className="w-28 h-9"
              placeholder="0"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Премия, ₽</span>
            <Input
              type="number"
              min="0"
              step="100"
              value={row.bonusInput}
              onChange={(e) => updateRow(row.email, { bonusInput: e.target.value })}
              className="w-28 h-9"
              placeholder="5000"
            />
          </div>

          <Button size="sm" className="h-9" onClick={() => savePlan(row)} disabled={row.saving}>
            {row.saving ? '...' : 'Сохранить'}
          </Button>
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">
            {row.planType === 'income' ? 'Доход за период' : 'Отработано смен'}
          </span>
          <span className="font-semibold text-foreground">
            {row.planType === 'income'
              ? `$${row.income_fact.toFixed(0)} / $${row.income_plan.toFixed(0)}`
              : `${row.shifts_count} / ${row.shifts_target}`}
          </span>
        </div>
        <Progress
          value={progressPct(row)}
          className={row.bonus_ready ? '[&>div]:bg-green-500' : '[&>div]:bg-purple-500'}
        />
      </div>

      <p
        className={`text-xs mt-2 font-semibold ${
          row.bonus_ready ? 'text-green-500' : 'text-muted-foreground/60'
        }`}
      >
        {row.bonus_ready ? 'Премия заработана: ' : 'Премия: '}
        {(parseFloat(row.bonusInput) || 0).toLocaleString('ru-RU')} ₽
      </p>
    </div>
  );

  const renderSection = (
    title: string,
    iconName: string,
    list: EmployeeRow[],
    emptyText: string,
    countLabel: string,
  ) => {
    const readyCount = list.filter((r) => r.bonus_ready).length;
    const bonusSum = sumBonus(list);

    return (
      <Card className="border-border/50 bg-secondary/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground font-heading">
            <Icon name={iconName} size={20} className="text-primary" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!loading && list.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <div className="rounded-lg border border-border/50 bg-background/40 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Icon name="Users" size={14} />
                  {countLabel}
                </div>
                <div className="text-xl sm:text-2xl font-bold text-foreground">{list.length}</div>
              </div>

              <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Icon name="TrendingUp" size={14} className="text-purple-500" />
                  Выполнили план
                </div>
                <div className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {readyCount} / {list.length}
                </div>
              </div>

              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Icon name="Gift" size={14} className="text-amber-500" />
                  Премий к выплате
                </div>
                <div className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {bonusSum.toLocaleString('ru-RU')} ₽
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="py-10 text-center text-muted-foreground">Загрузка...</div>
          ) : list.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">{emptyText}</div>
          ) : (
            <div className="space-y-3">{list.map(renderCard)}</div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-secondary/30 backdrop-blur-sm px-4 py-2.5">
        <span className="text-sm font-medium text-foreground">Период</span>
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
        {renderSection(
          'Планы продюсеров и премии',
          'Target',
          producerRows,
          'Продюсеров нет',
          'Всего продюсеров',
        )}
        {renderSection(
          'Планы сотрудников и премии',
          'UserCheck',
          staffRows,
          'Сотрудников нет',
          'Всего сотрудников',
        )}
      </div>
    </div>
  );
};

export default ProducerPlansManager;