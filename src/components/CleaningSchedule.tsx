import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { getAuthHeaders } from '@/lib/api';

const CLEANING_URL = 'https://functions.poehali.dev/763769d4-880c-4e9f-8350-9ef2c9551ec3';
const USERS_API_URL = 'https://functions.poehali.dev/67fd6902-6170-487e-bb46-f6d14ec99066';

interface CleaningItem {
  id: number;
  cleaning_date: string;
  apartment_name: string;
  comment: string;
  operator_emails: string;
  created_by_email: string;
}

interface OperatorUser {
  email: string;
  fullName?: string;
  role: string;
}

interface CleaningScheduleProps {
  userRole?: string;
  userEmail: string;
  onBack: () => void;
}

const formatDate = (iso: string) => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      weekday: 'long',
    });
  } catch {
    return iso;
  }
};

const emailsToArr = (s: string) =>
  (s || '').split(',').map((e) => e.trim()).filter(Boolean);

const CleaningSchedule = ({ userRole, userEmail, onBack }: CleaningScheduleProps) => {
  const [items, setItems] = useState<CleaningItem[]>([]);
  const [operators, setOperators] = useState<OperatorUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formDate, setFormDate] = useState('');
  const [formApartment, setFormApartment] = useState('');
  const [formComment, setFormComment] = useState('');
  const [formOperators, setFormOperators] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const canEdit = userRole === 'producer' || userRole === 'director';

  const weekDates = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    monday.setDate(today.getDate() + diff + weekOffset * 7);
    const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const result: { iso: string; label: string; day: string }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      result.push({
        iso,
        label: d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
        day: dayNames[i],
      });
    }
    return result;
  }, [weekOffset]);

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(CLEANING_URL, { method: 'GET' });
      const data = await res.json();
      setItems(data.items || []);
    } catch (err) {
      console.error(err);
      toast({ title: 'Ошибка', description: 'Не удалось загрузить график', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const loadOperators = async () => {
    try {
      const res = await fetch(USERS_API_URL, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setOperators(data.filter((u: OperatorUser) => u.role === 'operator'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    load();
    loadOperators();
  }, []);

  const itemsByDate = useMemo(() => {
    const map: Record<string, CleaningItem[]> = {};
    for (const it of items) {
      const key = it.cleaning_date.slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(it);
    }
    return map;
  }, [items]);

  const openCreate = (dateIso?: string) => {
    setEditingId(null);
    setFormDate(dateIso || weekDates[0]?.iso || '');
    setFormApartment('');
    setFormComment('');
    setFormOperators([]);
    setIsDialogOpen(true);
  };

  const openEdit = (item: CleaningItem) => {
    setEditingId(item.id);
    setFormDate(item.cleaning_date.slice(0, 10));
    setFormApartment(item.apartment_name || '');
    setFormComment(item.comment || '');
    setFormOperators(emailsToArr(item.operator_emails));
    setIsDialogOpen(true);
  };

  const toggleOperator = (email: string) => {
    setFormOperators((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email],
    );
  };

  const submit = async () => {
    if (!formDate) {
      toast({ title: 'Укажите дату', variant: 'destructive' });
      return;
    }
    if (formOperators.length === 0) {
      toast({ title: 'Выберите хотя бы одного оператора', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        action: editingId ? 'update' : 'create',
        id: editingId,
        cleaning_date: formDate,
        apartment_name: formApartment,
        comment: formComment,
        operator_emails: formOperators,
        created_by_email: userEmail,
      };
      const res = await fetch(CLEANING_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      toast({ title: editingId ? 'Уборка обновлена' : 'Уборка добавлена' });
      setIsDialogOpen(false);
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка';
      toast({ title: 'Ошибка', description: msg, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm('Удалить запись об уборке?')) return;
    try {
      const res = await fetch(CLEANING_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      if (!res.ok) throw new Error('Delete failed');
      toast({ title: 'Удалено' });
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка';
      toast({ title: 'Ошибка', description: msg, variant: 'destructive' });
    }
  };

  const operatorName = (email: string) => {
    const u = operators.find((o) => o.email === email);
    return u?.fullName || email;
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
            <Icon name="ArrowLeft" size={16} />
            Назад
          </Button>
          <div>
            <h2 className="text-3xl font-serif font-bold">График уборки</h2>
            <p className="text-sm text-muted-foreground">
              Назначайте операторов на уборку квартир
            </p>
          </div>
        </div>
        {canEdit && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={() => openCreate()}>
                <Icon name="Plus" size={16} />
                Добавить уборку
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? 'Редактировать уборку' : 'Новая уборка'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Дата</label>
                  <Input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Квартира (необязательно)</label>
                  <Input
                    value={formApartment}
                    onChange={(e) => setFormApartment(e.target.value)}
                    placeholder="Например: 1 локация"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Комментарий</label>
                  <Textarea
                    value={formComment}
                    onChange={(e) => setFormComment(e.target.value)}
                    placeholder="Что нужно сделать"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Операторы</label>
                  <div className="max-h-48 overflow-y-auto rounded-md border p-2 space-y-1">
                    {operators.length === 0 ? (
                      <p className="text-xs text-muted-foreground p-2">
                        Нет доступных операторов
                      </p>
                    ) : (
                      operators.map((op) => (
                        <label
                          key={op.email}
                          className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer"
                        >
                          <Checkbox
                            checked={formOperators.includes(op.email)}
                            onCheckedChange={() => toggleOperator(op.email)}
                          />
                          <span className="text-sm">
                            {op.fullName || op.email}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Отмена
                </Button>
                <Button onClick={submit} disabled={isSaving}>
                  {isSaving ? 'Сохранение...' : 'Сохранить'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="p-4 flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setWeekOffset((v) => v - 1)}
          className="gap-2"
        >
          <Icon name="ChevronLeft" size={16} />
          Прошлая
        </Button>
        <div className="text-sm font-medium">
          {weekOffset === 0 ? 'Текущая неделя' : weekOffset > 0 ? `+${weekOffset} нед.` : `${weekOffset} нед.`}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setWeekOffset((v) => v + 1)}
          className="gap-2"
        >
          Следующая
          <Icon name="ChevronRight" size={16} />
        </Button>
      </Card>

      {isLoading ? (
        <Card className="p-8 text-center text-muted-foreground">Загрузка...</Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-7">
          {weekDates.map((wd) => {
            const dayItems = itemsByDate[wd.iso] || [];
            return (
              <Card key={wd.iso} className="p-3 space-y-2 min-h-[120px] flex flex-col">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase text-muted-foreground">
                      {wd.day}
                    </div>
                    <div className="text-sm font-medium">{wd.label}</div>
                  </div>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => openCreate(wd.iso)}
                    >
                      <Icon name="Plus" size={14} />
                    </Button>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  {dayItems.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">Уборок нет</p>
                  ) : (
                    dayItems.map((it) => {
                      const ops = emailsToArr(it.operator_emails);
                      return (
                        <div
                          key={it.id}
                          className="rounded-md border p-2 text-xs space-y-1 bg-muted/30"
                        >
                          {it.apartment_name && (
                            <div className="font-semibold">{it.apartment_name}</div>
                          )}
                          {it.comment && (
                            <div className="text-muted-foreground line-clamp-2">
                              {it.comment}
                            </div>
                          )}
                          <div className="flex flex-wrap gap-1">
                            {ops.map((e) => (
                              <Badge key={e} variant="secondary" className="text-[10px]">
                                {operatorName(e)}
                              </Badge>
                            ))}
                          </div>
                          {canEdit && (
                            <div className="flex gap-1 pt-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => openEdit(it)}
                              >
                                <Icon name="Pencil" size={12} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive"
                                onClick={() => remove(it.id)}
                              >
                                <Icon name="Trash2" size={12} />
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CleaningSchedule;
