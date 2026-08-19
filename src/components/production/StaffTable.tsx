import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import { authenticatedFetchNoCreds } from '@/lib/api';
import funcUrls from '../../../backend/func2url.json';

const STAFF_URL = (funcUrls as Record<string, string>)['production-staff'];

export interface StaffRow {
  id: number;
  kind: 'operator' | 'model';
  full_name: string;
  birth_date: string;
  phone: string;
  telegram: string;
  google_account: string;
}

type Column = {
  key: keyof Omit<StaffRow, 'id' | 'kind'>;
  label: string;
  head: string;
  width: string;
  placeholder: string;
};

const OPERATOR_COLUMNS: Column[] = [
  {
    key: 'birth_date',
    label: 'Дата рождения',
    head: 'bg-red-500/15 border-red-500/30',
    width: 'w-36',
    placeholder: 'дд.мм.гггг',
  },
  {
    key: 'full_name',
    label: 'Имя Фамилия',
    head: 'bg-amber-500/15 border-amber-500/30',
    width: 'min-w-[200px]',
    placeholder: 'Имя Фамилия',
  },
  {
    key: 'phone',
    label: 'Телефон',
    head: 'bg-emerald-500/15 border-emerald-500/30',
    width: 'w-44',
    placeholder: '89991234567',
  },
  {
    key: 'telegram',
    label: 'Телеграм',
    head: 'bg-blue-500/15 border-blue-500/30',
    width: 'w-40',
    placeholder: '@telegram',
  },
  {
    key: 'google_account',
    label: 'Google аккаунт',
    head: 'bg-purple-500/15 border-purple-500/30',
    width: 'min-w-[200px]',
    placeholder: 'mail@gmail.com',
  },
];

const MODEL_COLUMNS: Column[] = [
  {
    key: 'full_name',
    label: 'Имя Фамилия',
    head: 'bg-amber-500/15 border-amber-500/30',
    width: 'min-w-[200px]',
    placeholder: 'Имя Фамилия',
  },
];

const emptyRow = (kind: StaffRow['kind']): StaffRow => ({
  id: 0,
  kind,
  full_name: '',
  birth_date: '',
  phone: '',
  telegram: '',
  google_account: '',
});

interface StaffTableProps {
  owner: string;
}

const StaffTable = ({ owner }: StaffTableProps) => {
  const { toast } = useToast();
  const [operators, setOperators] = useState<StaffRow[]>([]);
  const [models, setModels] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authenticatedFetchNoCreds(`${STAFF_URL}?owner=${encodeURIComponent(owner)}`);
      const data = await res.json();
      setOperators(Array.isArray(data.operators) ? data.operators : []);
      setModels(Array.isArray(data.models) ? data.models : []);
    } catch {
      toast({ title: 'Не удалось загрузить штат', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast, owner]);

  useEffect(() => {
    load();
  }, [load]);

  const updateLocal = (kind: StaffRow['kind'], id: number, patch: Partial<StaffRow>) => {
    const setter = kind === 'operator' ? setOperators : setModels;
    setter((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const saveRow = async (row: StaffRow) => {
    setSavingId(row.id);
    try {
      const res = await authenticatedFetchNoCreds(STAFF_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', owner, ...row }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка');
      toast({ title: 'Сохранено' });
      await load();
    } catch {
      toast({ title: 'Не удалось сохранить', variant: 'destructive' });
    } finally {
      setSavingId(null);
    }
  };

  const addRow = async (kind: StaffRow['kind']) => {
    try {
      const res = await authenticatedFetchNoCreds(STAFF_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', owner, ...emptyRow(kind) }),
      });
      if (!res.ok) throw new Error('Ошибка');
      await load();
    } catch {
      toast({ title: 'Не удалось добавить строку', variant: 'destructive' });
    }
  };

  const deleteRow = async (row: StaffRow) => {
    try {
      const res = await authenticatedFetchNoCreds(STAFF_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', owner, id: row.id }),
      });
      if (!res.ok) throw new Error('Ошибка');
      await load();
    } catch {
      toast({ title: 'Не удалось удалить', variant: 'destructive' });
    }
  };

  const renderTable = (
    title: string,
    kind: StaffRow['kind'],
    columns: Column[],
    rows: StaffRow[],
  ) => (
    <Card className="border-border/50 bg-secondary/30 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-foreground font-heading">
            <Icon name={kind === 'operator' ? 'Video' : 'Users'} size={20} className="text-primary" />
            {title}
            <span className="text-sm font-normal text-muted-foreground">({rows.length})</span>
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => addRow(kind)}>
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
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={`border px-3 py-2 text-center font-medium text-foreground ${col.head} ${col.width}`}
                    >
                      {col.label}
                    </th>
                  ))}
                  <th className="border border-border/40 px-2 py-2 w-12" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-background/40">
                    {columns.map((col) => (
                      <td key={col.key} className="border border-border/40 p-0">
                        <Input
                          value={row[col.key] || ''}
                          placeholder={col.placeholder}
                          onChange={(e) => updateLocal(kind, row.id, { [col.key]: e.target.value })}
                          onBlur={() => saveRow(row)}
                          className="h-10 rounded-none border-0 bg-transparent text-center focus-visible:ring-1 focus-visible:ring-primary/40"
                        />
                      </td>
                    ))}
                    <td className="border border-border/40 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        disabled={savingId === row.id}
                        onClick={() => deleteRow(row)}
                      >
                        <Icon name="Trash2" size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4 items-start">
      {renderTable('Операторы', 'operator', OPERATOR_COLUMNS, operators)}
      {renderTable('Модели', 'model', MODEL_COLUMNS, models)}
    </div>
  );
};

export default StaffTable;
