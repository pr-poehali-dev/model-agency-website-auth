import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import { authenticatedFetchNoCreds } from '@/lib/api';
import SaveBar from './SaveBar';
import funcUrls from '../../../backend/func2url.json';

const EQUIPMENT_URL = (funcUrls as Record<string, string>)['production-staff'];

interface EquipmentRow {
  id: number;
  title: string;
  kind: string;
  serial_number: string;
  status: string;
  holder: string;
}

const KINDS = ['Камера', 'Объектив', 'Свет', 'Микрофон', 'Штатив', 'Ноутбук', 'Телефон', 'Другое'];

interface EquipmentTableProps {
  owner: string;
}

const EquipmentTable = ({ owner }: EquipmentTableProps) => {
  const { toast } = useToast();
  const [rows, setRows] = useState<EquipmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState<Record<number, EquipmentRow>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authenticatedFetchNoCreds(
        `${EQUIPMENT_URL}?table=equipment&owner=${encodeURIComponent(owner)}`,
      );
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
    const res = await authenticatedFetchNoCreds(EQUIPMENT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'equipment', owner, ...payload }),
    });
    if (!res.ok) throw new Error('Ошибка');
  };

  const updateLocal = (id: number, patch: Partial<EquipmentRow>) => {
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

  const stats = useMemo(
    () => ({
      free: rows.filter((r) => r.status !== 'busy').length,
      busy: rows.filter((r) => r.status === 'busy').length,
    }),
    [rows],
  );

  return (
    <div className="space-y-4">
      <Card className="border-border/50 bg-secondary/30 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex flex-wrap items-center gap-2 text-foreground font-heading">
              <Icon name="Video" size={20} className="text-primary" />
              Оборудование
              <span className="text-sm font-normal text-muted-foreground">
                свободно {stats.free} · на руках {stats.busy}
              </span>
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
              Пока пусто — нажми «Строка», чтобы добавить технику
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border border-border/40 bg-blue-500/15 px-3 py-2 text-center font-medium text-foreground min-w-[180px]">
                      Название
                    </th>
                    <th className="border border-border/40 bg-purple-500/15 px-3 py-2 text-center font-medium text-foreground w-40">
                      Тип
                    </th>
                    <th className="border border-border/40 bg-amber-500/15 px-3 py-2 text-center font-medium text-foreground w-40">
                      Серийный номер
                    </th>
                    <th className="border border-border/40 bg-emerald-500/15 px-3 py-2 text-center font-medium text-foreground w-40">
                      Статус
                    </th>
                    <th className="border border-border/40 bg-rose-500/15 px-3 py-2 text-center font-medium text-foreground min-w-[160px]">
                      У кого сейчас
                    </th>
                    <th className="border border-border/40 px-2 py-2 w-12" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const busy = row.status === 'busy';
                    return (
                      <tr key={row.id} className="hover:bg-background/40">
                        <td className="border border-border/40 p-0">
                          <Input
                            value={row.title || ''}
                            placeholder="Например, Sony A7 IV"
                            onChange={(e) => updateLocal(row.id, { title: e.target.value })}
                            className="h-10 rounded-none border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-primary/40"
                          />
                        </td>
                        <td className="border border-border/40 p-0">
                          <Select
                            value={row.kind || ''}
                            onValueChange={(value) => updateLocal(row.id, { kind: value })}
                          >
                            <SelectTrigger className="h-10 rounded-none border-0 bg-transparent focus:ring-1 focus:ring-primary/40">
                              <SelectValue placeholder="Тип" />
                            </SelectTrigger>
                            <SelectContent>
                              {KINDS.map((k) => (
                                <SelectItem key={k} value={k}>
                                  {k}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="border border-border/40 p-0">
                          <Input
                            value={row.serial_number || ''}
                            placeholder="SN-000000"
                            onChange={(e) => updateLocal(row.id, { serial_number: e.target.value })}
                            className="h-10 rounded-none border-0 bg-transparent text-center focus-visible:ring-1 focus-visible:ring-primary/40"
                          />
                        </td>
                        <td
                          className={`border border-border/40 p-0 ${busy ? 'bg-amber-500/10' : 'bg-emerald-500/10'}`}
                        >
                          <Select
                            value={busy ? 'busy' : 'free'}
                            onValueChange={(value) =>
                              updateLocal(row.id, {
                                status: value,
                                holder: value === 'free' ? '' : row.holder,
                              })
                            }
                          >
                            <SelectTrigger className="h-10 rounded-none border-0 bg-transparent focus:ring-1 focus:ring-primary/40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free">Свободно</SelectItem>
                              <SelectItem value="busy">На руках</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="border border-border/40 p-0">
                          <Input
                            value={row.holder || ''}
                            placeholder={busy ? 'Имя сотрудника' : '—'}
                            disabled={!busy}
                            onChange={(e) => updateLocal(row.id, { holder: e.target.value })}
                            className="h-10 rounded-none border-0 bg-transparent text-center focus-visible:ring-1 focus-visible:ring-primary/40 disabled:opacity-50"
                          />
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
                    );
                  })}
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

export default EquipmentTable;
