import { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch } from '@/lib/api';
import { API_URLS } from '@/lib/apiUrls';
import EmployeeStatusList, {
  type EmployeeStatus,
} from './active-sessions/EmployeeStatusList';
import SessionsDialog from './active-sessions/SessionsDialog';

const ActiveSessionsTab = () => {
  const [employees, setEmployees] = useState<EmployeeStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<EmployeeStatus | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [search, setSearch] = useState('');

  const { toast } = useToast();

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setIsLoading(true);
      try {
        const res = await authenticatedFetch(API_URLS.activeSessions);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Не удалось загрузить данные');
        }

        setEmployees(data.employees || []);
        setLastUpdated(new Date());
      } catch (err) {
        if (!silent) {
          const msg = err instanceof Error ? err.message : 'Ошибка загрузки';
          toast({ title: 'Ошибка', description: msg, variant: 'destructive' });
        }
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!autoRefresh) return;

    const timer = setInterval(() => {
      if (document.visibilityState === 'visible' && !selected) {
        load(true);
      }
    }, 60000);

    return () => clearInterval(timer);
  }, [autoRefresh, load, selected]);

  const onlineCount = employees.filter((e) => e.online).length;
  const totalSessions = employees.reduce((sum, e) => sum + e.sessionCount, 0);

  const visible = employees.filter((e) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (e.fullName || '').toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Активные сессии</h2>
          <p className="text-sm text-muted-foreground">
            Кто сейчас в системе
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

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Сейчас в сети</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {onlineCount}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Всего сотрудников</div>
          <div className="text-2xl font-bold">{employees.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Активных сессий</div>
          <div className="text-2xl font-bold">{totalSessions}</div>
        </Card>
      </div>

      <div className="relative max-w-sm">
        <Icon
          name="Search"
          size={15}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск сотрудника"
          className="pl-8 h-9"
        />
      </div>

      <EmployeeStatusList
        employees={visible}
        isLoading={isLoading}
        onSelect={setSelected}
      />

      <SessionsDialog
        employee={selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        onChanged={() => load(true)}
      />
    </div>
  );
};

export default ActiveSessionsTab;
