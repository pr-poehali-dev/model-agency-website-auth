import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { authenticatedFetchNoCreds } from '@/lib/api';
import SaveBar from './SaveBar';
import { useCashEmployees } from './useCashEmployees';
import funcUrls from '../../../backend/func2url.json';

const CASH_URL = (funcUrls as Record<string, string>)['production-staff'];

interface CashRow {
  id: number;
  employee_name: string;
  n5000: number;
  n1000: number;
  n500: number;
  salary: number;
}

const NOMINALS = [
  { key: 'n5000' as const, value: 5000, label: '5000', head: 'bg-orange-500/15 border-orange-500/30' },
  { key: 'n1000' as const, value: 1000, label: '1000', head: 'bg-blue-500/15 border-blue-500/30' },
  { key: 'n500' as const, value: 500, label: '500', head: 'bg-purple-500/15 border-purple-500/30' },
];

const rub = (n: number) => `${n.toLocaleString('ru-RU')} ₽`;

interface CashCountTableProps {
  viewerEmail: string;
  viewerRole: string;
  owner: string;
}

const CashCountTable = ({ viewerEmail, viewerRole, owner }: CashCountTableProps) => {
  const { toast } = useToast();
  const { employees } = useCashEmployees(viewerEmail, viewerRole);
  const [rows, setRows] = useState<CashRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState<Record<number, CashRow>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authenticatedFetchNoCreds(`${CASH_URL}?table=cash&owner=${encodeURIComponent(owner)}`);
      const data = await res.json();
      setRows(Array.isArray(data.rows) ? data.rows : []);
      setDirty({});
    } catch {
      toast({ title: 'Не удалось загрузить', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast, owner]);

  useEffect(() => {
    load();
  }, [load]);

  const send = async (payload: Record<string, unknown>) => {
    const res = await authenticatedFetchNoCreds(CASH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'cash', owner, ...payload }),
    });
    if (!res.ok) throw new Error('Ошибка');
  };

  const updateLocal = (id: number, patch: Partial<CashRow>) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const next = { ...r, ...patch };
        setDirty((d) => ({ ...d, [id]: next }));
        return next;
      }),
    );
  };

  const saveAll = async () => {
    const list = Object.values(dirty);
    if (list.length === 0) return;
    setSaving(true);
    try {
      for (const row of list) {
        await send({ action: 'save', ...row });
      }
      toast({ title: `Сохранено строк: ${list.length}` });
      await load();
    } catch {
      toast({ title: 'Не удалось сохранить', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const addRow = async () => {
    try {
      await send({ action: 'save' });
      await load();
    } catch {
      toast({ title: 'Не удалось добавить строку', variant: 'destructive' });
    }
  };

  const deleteRow = async (id: number) => {
    try {
      await send({ action: 'delete', id });
      await load();
    } catch {
      toast({ title: 'Не удалось удалить', variant: 'destructive' });
    }
  };

  const rowTotal = (row: CashRow) =>
    NOMINALS.reduce((sum, n) => sum + (Number(row[n.key]) || 0) * n.value, 0);

  const takenNames = useMemo(
    () => new Set(rows.map((r) => (r.employee_name || '').trim()).filter(Boolean)),
    [rows],
  );

  const totals = useMemo(() => {
    const counts = NOMINALS.map((n) =>
      rows.reduce((sum, r) => sum + (Number(r[n.key]) || 0), 0),
    );
    return {
      counts,
      sums: NOMINALS.map((n, i) => counts[i] * n.value),
      grand: rows.reduce((sum, r) => sum + rowTotal(r), 0),
      salary: rows.reduce((sum, r) => sum + (Number(r.salary) || 0), 0),
    };
  }, [rows]);

  const numberCell = (row: CashRow, key: keyof CashRow) => (
    <Input
      type="number"
      min="0"
      value={row[key] === 0 ? '' : String(row[key] ?? '')}
      placeholder="0"
      onChange={(e) => updateLocal(row.id, { [key]: Number(e.target.value) || 0 })}
      className="h-10 rounded-none border-0 bg-transparent text-right focus-visible:ring-1 focus-visible:ring-primary/40"
    />
  );

  return (
    <div className="space-y-4">
    <Card className="border-border/50 bg-secondary/30 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-foreground font-heading">
            <Icon name="Banknote" size={20} className="text-primary" />
            Production
            <span className="text-sm font-normal text-muted-foreground">({rows.length})</span>
          </CardTitle>
          <Button size="sm" variant="outline" onClick={addRow}>
            <Icon name="Plus" size={14} className="mr-1.5" />
            Строка
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-10 text-center text-muted-foreground">Загрузка...</div>
        ) : rows.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            Пока пусто — нажми «Строка», чтобы добавить
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border border-border/40 bg-indigo-500/10 px-3 py-2 text-left font-medium text-foreground min-w-[180px]">
                    Сотрудник
                  </th>
                  {NOMINALS.map((n) => (
                    <th
                      key={n.key}
                      className={`border px-3 py-2 text-center font-bold text-foreground w-32 ${n.head}`}
                    >
                      {n.label}
                    </th>
                  ))}
                  <th className="border border-border/40 bg-emerald-500/10 px-3 py-2 text-center font-medium text-foreground w-36">
                    Проверка
                  </th>
                  <th className="border border-border/40 bg-emerald-500/10 px-3 py-2 text-center font-medium text-foreground w-32">
                    Зарплата
                  </th>
                  <th className="border border-border/40 px-2 py-2 w-12" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className={
                      employees.find((e) => e.name === row.employee_name)?.role === 'producer'
                        ? 'bg-primary/10 hover:bg-primary/15'
                        : 'hover:bg-background/40'
                    }
                  >
                    <td className="border border-border/40 p-0">
                      <Select
                        value={row.employee_name || ''}
                        onValueChange={(value) => {
                          if (value !== row.employee_name && takenNames.has(value)) {
                            toast({
                              title: 'Этот сотрудник уже есть в таблице',
                              variant: 'destructive',
                            });
                            return;
                          }
                          const picked = employees.find((e) => e.name === value);
                          const patch = {
                            employee_name: value,
                            salary: picked ? picked.salary : row.salary,
                          };
                          updateLocal(row.id, patch);
                        }}
                      >
                        <SelectTrigger className="h-10 rounded-none border-0 bg-transparent focus:ring-1 focus:ring-primary/40">
                          <SelectValue placeholder="Выбери сотрудника" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.length === 0 ? (
                            <div className="px-2 py-3 text-sm text-muted-foreground">
                              Нет сотрудников
                            </div>
                          ) : (
                            employees.map((emp) => (
                              <SelectItem
                                key={emp.email}
                                value={emp.name}
                                disabled={emp.name !== row.employee_name && takenNames.has(emp.name)}
                              >
                                {emp.name}
                                {emp.role === 'producer' && (
                                  <span className="ml-2 text-xs text-primary">продюсер</span>
                                )}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </td>
                    {NOMINALS.map((n) => (
                      <td key={n.key} className="border border-border/40 p-0">
                        {numberCell(row, n.key)}
                      </td>
                    ))}
                    <td className="border border-border/40 bg-emerald-500/5 px-3 text-right font-semibold text-foreground">
                      {rub(rowTotal(row))}
                    </td>
                    <td className="border border-border/40 bg-emerald-500/5 px-3 text-right font-semibold text-foreground">
                      {rub(Number(row.salary) || 0)}
                    </td>
                    <td className="border border-border/40 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteRow(row.id)}
                      >
                        <Icon name="Trash2" size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}

                <tr className="bg-background/40">
                  <td className="border border-border/40 px-3 py-2 font-medium text-foreground">
                    Проверка
                  </td>
                  {totals.sums.map((sum, i) => (
                    <td
                      key={NOMINALS[i].key}
                      className="border border-border/40 px-3 py-2 text-right text-foreground"
                    >
                      {sum.toLocaleString('ru-RU')}
                    </td>
                  ))}
                  <td className="border border-border/40" colSpan={3} />
                </tr>

                <tr className="bg-emerald-500/10">
                  <td className="border border-border/40 px-3 py-2 font-bold text-foreground">
                    Сумма купюр
                  </td>
                  {totals.counts.map((count, i) => (
                    <td
                      key={NOMINALS[i].key}
                      className="border border-border/40 px-3 py-2 text-right font-bold text-foreground"
                    >
                      {count}
                    </td>
                  ))}
                  <td className="border border-border/40 bg-emerald-500/20 px-3 py-2 text-right text-lg font-bold text-foreground">
                    {rub(totals.grand)}
                  </td>
                  <td className="border border-border/40 px-3 py-2 text-right text-lg font-bold text-foreground">
                    {rub(totals.salary)}
                  </td>
                  <td className="border border-border/40" />
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>

      <SaveBar
        dirtyCount={Object.keys(dirty).length}
        saving={saving}
        onSave={saveAll}
        onReset={load}
      />
    </div>
  );
};

export default CashCountTable;
