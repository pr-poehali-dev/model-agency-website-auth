import { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch } from '@/lib/api';
import { API_URLS } from '@/lib/apiUrls';
import SessionsTable, {
  SessionRecord,
} from './active-sessions/SessionsTable';

const ActiveSessionsTab = () => {
  const [items, setItems] = useState<SessionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [terminatingId, setTerminatingId] = useState<number | null>(null);
  const [target, setTarget] = useState<SessionRecord | null>(null);
  const [allDevices, setAllDevices] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const { toast } = useToast();

  const load = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await authenticatedFetch(API_URLS.activeSessions);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Не удалось загрузить сессии');
      }

      setItems(data.items || []);
      setLastUpdated(new Date());
    } catch (err) {
      if (!silent) {
        const msg = err instanceof Error ? err.message : 'Ошибка загрузки';
        toast({ title: 'Ошибка', description: msg, variant: 'destructive' });
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!autoRefresh) return;

    const timer = setInterval(() => {
      if (document.visibilityState === 'visible' && !target) {
        load(true);
      }
    }, 60000);

    return () => clearInterval(timer);
  }, [autoRefresh, load, target]);

  const handleConfirm = async () => {
    if (!target) return;

    setTerminatingId(target.id);
    try {
      const payload = allDevices
        ? { action: 'terminate_user', userId: target.userId }
        : { action: 'terminate_session', sessionId: target.id };

      const res = await authenticatedFetch(API_URLS.activeSessions, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Не удалось завершить сессию');
      }

      toast({
        title: 'Сессия завершена',
        description: allDevices
          ? `${target.fullName || target.email} вышел со всех устройств`
          : `${target.fullName || target.email} вышел из системы`,
      });

      setTarget(null);
      setAllDevices(false);
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка';
      toast({ title: 'Ошибка', description: msg, variant: 'destructive' });
    } finally {
      setTerminatingId(null);
    }
  };

  const uniqueUsers = new Set(items.map((i) => i.email)).size;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Активные сессии</h2>
          <p className="text-sm text-muted-foreground">
            Кто сейчас в системе и с какого устройства
            {lastUpdated && (
              <span className="ml-1">
                · обновлено в{' '}
                {lastUpdated.toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
            Автообновление
          </label>
          <Button variant="outline" onClick={() => load()} className="gap-2">
            <Icon name="RefreshCw" size={16} />
            Обновить
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Активных сессий</div>
          <div className="text-2xl font-bold">{items.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Сотрудников в системе</div>
          <div className="text-2xl font-bold">{uniqueUsers}</div>
        </Card>
      </div>

      <SessionsTable
        items={items}
        isLoading={isLoading}
        terminatingId={terminatingId}
        onTerminate={(session) => {
          setTarget(session);
          setAllDevices(false);
        }}
      />

      <AlertDialog
        open={!!target}
        onOpenChange={(open) => {
          if (!open) {
            setTarget(null);
            setAllDevices(false);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Завершить сессию?</AlertDialogTitle>
            <AlertDialogDescription>
              {target?.fullName || target?.email} будет принудительно разлогинен
              и вернётся на страницу входа.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={allDevices}
              onChange={(e) => setAllDevices(e.target.checked)}
              className="h-4 w-4"
            />
            Завершить на всех устройствах этого сотрудника
          </label>

          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Завершить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ActiveSessionsTab;