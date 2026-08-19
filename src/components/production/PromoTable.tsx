import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import { authenticatedFetchNoCreds } from '@/lib/api';
import funcUrls from '../../../backend/func2url.json';

const PROMO_URL = (funcUrls as Record<string, string>)['production-staff'];

interface PromoRow {
  id: number;
  login: string;
  password: string;
  sign_name: string;
  sign_date: string;
  model_name: string;
}

type Column = {
  key: keyof Omit<PromoRow, 'id'>;
  label: string;
  head: string;
  width: string;
  placeholder: string;
};

const COLUMNS: Column[] = [
  {
    key: 'login',
    label: 'Логин',
    head: 'bg-blue-500/15 border-blue-500/30',
    width: 'min-w-[160px]',
    placeholder: 'login',
  },
  {
    key: 'password',
    label: 'Пароль',
    head: 'bg-blue-500/15 border-blue-500/30',
    width: 'min-w-[160px]',
    placeholder: 'password',
  },
  {
    key: 'sign_name',
    label: 'ФИО для подписи',
    head: 'bg-emerald-500/15 border-emerald-500/30',
    width: 'min-w-[200px]',
    placeholder: 'NAME SURNAME',
  },
  {
    key: 'sign_date',
    label: 'Дата подписания',
    head: 'bg-emerald-500/15 border-emerald-500/30',
    width: 'w-40',
    placeholder: 'дд.мм',
  },
  {
    key: 'model_name',
    label: 'Модель',
    head: 'bg-emerald-500/15 border-emerald-500/30',
    width: 'min-w-[160px]',
    placeholder: 'name',
  },
];

const PromoTable = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<PromoRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authenticatedFetchNoCreds(`${PROMO_URL}?table=promo`);
      const data = await res.json();
      setRows(Array.isArray(data.rows) ? data.rows : []);
    } catch {
      toast({ title: 'Не удалось загрузить', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const send = async (payload: Record<string, unknown>) => {
    const res = await authenticatedFetchNoCreds(PROMO_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'promo', ...payload }),
    });
    if (!res.ok) throw new Error('Ошибка');
  };

  const updateLocal = (id: number, patch: Partial<PromoRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const saveRow = async (row: PromoRow) => {
    try {
      await send({ action: 'save', ...row });
      toast({ title: 'Сохранено' });
      await load();
    } catch {
      toast({ title: 'Не удалось сохранить', variant: 'destructive' });
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

  return (
    <Card className="border-border/50 bg-secondary/30 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-foreground font-heading">
            <Icon name="Megaphone" size={20} className="text-primary" />
            Свободные
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
                  {COLUMNS.map((col) => (
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
                    {COLUMNS.map((col) => (
                      <td key={col.key} className="border border-border/40 p-0">
                        <Input
                          value={row[col.key] || ''}
                          placeholder={col.placeholder}
                          onChange={(e) => updateLocal(row.id, { [col.key]: e.target.value })}
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
                        onClick={() => deleteRow(row.id)}
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
};

export default PromoTable;
