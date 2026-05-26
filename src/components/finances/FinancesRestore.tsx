import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const BACKUP_URL = 'https://functions.poehali.dev/fdc50076-fc3b-4243-aebc-dfeb4c16e1ff';

interface Snapshot {
  snapshot_date: string;
  rows_count: number;
  snapshot_at: string;
}

const FinancesRestore = () => {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const { toast } = useToast();

  const loadSnapshots = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(BACKUP_URL, { method: 'GET' });
      const data = await res.json();
      const list: Snapshot[] = data.snapshots || [];
      setSnapshots(list);
      if (list.length > 0 && !selectedDate) {
        setSelectedDate(list[0].snapshot_date);
      }
    } catch (err) {
      console.error(err);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить список снимков',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSnapshots();
  }, []);

  const handleRestore = async () => {
    if (!selectedDate) return;
    setIsRestoring(true);
    try {
      const res = await fetch(BACKUP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore', snapshot_date: selectedDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Restore failed');
      toast({
        title: 'Восстановлено',
        description: `Загружено строк: ${data.rows_restored} из снимка ${selectedDate}`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Неизвестная ошибка';
      toast({
        title: 'Ошибка восстановления',
        description: msg,
        variant: 'destructive',
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch {
      return iso;
    }
  };

  const selected = snapshots.find((s) => s.snapshot_date === selectedDate);

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold mb-1">Восстановление финансов из архива</h3>
          <p className="text-sm text-muted-foreground">
            Снимки делаются автоматически каждый день. Хранятся 90 дней.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={loadSnapshots} disabled={isLoading}>
          <Icon name="RefreshCw" size={16} className={isLoading ? 'animate-spin' : ''} />
        </Button>
      </div>

      {snapshots.length === 0 && !isLoading ? (
        <p className="text-sm text-muted-foreground">Архивных снимков ещё нет.</p>
      ) : (
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Выберите дату снимка</label>
            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger>
                <SelectValue placeholder="Дата снимка" />
              </SelectTrigger>
              <SelectContent>
                {snapshots.map((s) => (
                  <SelectItem key={s.snapshot_date} value={s.snapshot_date}>
                    {formatDate(s.snapshot_date)} — {s.rows_count} записей
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="gap-2"
                disabled={!selectedDate || isRestoring}
              >
                <Icon name="RotateCcw" size={16} />
                {isRestoring ? 'Восстановление...' : 'Восстановить выбранный снимок'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Восстановить финансы?</AlertDialogTitle>
                <AlertDialogDescription>
                  Текущие данные таблицы финансов будут полностью заменены данными из снимка
                  от <b>{selected ? formatDate(selected.snapshot_date) : ''}</b>
                  {selected ? ` (${selected.rows_count} записей).` : '.'} Это действие нельзя отменить.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <AlertDialogAction onClick={handleRestore}>Восстановить</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </Card>
  );
};

export default FinancesRestore;
