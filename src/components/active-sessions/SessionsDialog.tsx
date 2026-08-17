import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch } from '@/lib/api';
import { API_URLS } from '@/lib/apiUrls';
import { formatLastSeen, type EmployeeStatus } from './EmployeeStatusList';

export interface SessionRecord {
  id: number;
  userId: number;
  email: string;
  fullName?: string;
  role: string;
  ip?: string;
  device?: string;
  browser?: string;
  createdAt: string | null;
  expiresAt: string | null;
  lastSeenAt: string | null;
  isCurrent?: boolean;
}

interface Props {
  employee: EmployeeStatus | null;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}

const formatDateTime = (iso: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const SessionsDialog = ({ employee, onOpenChange, onChanged }: Props) => {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [busyAll, setBusyAll] = useState(false);
  const { toast } = useToast();

  const load = useCallback(async () => {
    if (!employee) return;
    setLoading(true);
    try {
      const res = await authenticatedFetch(
        `${API_URLS.activeSessions}?user_id=${employee.userId}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Не удалось загрузить');
      setSessions(data.sessions || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка загрузки';
      toast({ title: 'Ошибка', description: msg, variant: 'destructive' });
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [employee, toast]);

  useEffect(() => {
    if (employee) load();
  }, [employee, load]);

  const terminate = async (payload: Record<string, unknown>, sessionId?: number) => {
    if (sessionId) setBusyId(sessionId);
    else setBusyAll(true);
    try {
      const res = await authenticatedFetch(API_URLS.activeSessions, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Не удалось завершить');

      toast({ title: 'Сессия завершена' });
      await load();
      onChanged();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка';
      toast({ title: 'Ошибка', description: msg, variant: 'destructive' });
    } finally {
      setBusyId(null);
      setBusyAll(false);
    }
  };

  const name = employee?.fullName || employee?.email || '';

  return (
    <Dialog open={!!employee} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="MonitorSmartphone" size={18} className="text-primary" />
            Сессии · {name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-1">
          {employee && (
            <div className="flex items-center gap-2 text-sm">
              {employee.online ? (
                <Badge className="bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30">
                  В сети
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  Не в сети · {formatLastSeen(employee.lastSeenAt)}
                </Badge>
              )}
            </div>
          )}

          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Загрузка...
            </div>
          ) : sessions.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Активных сессий нет
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-lg border border-border/50 bg-background/40 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-foreground">
                            {s.browser || 'Неизвестный браузер'}
                          </span>
                          {s.isCurrent && (
                            <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px] px-1.5 py-0">
                              Текущая
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <Icon name="Monitor" size={12} />
                            {s.device || 'Устройство неизвестно'}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Icon name="Globe" size={12} />
                            {s.ip || 'IP неизвестен'}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Icon name="LogIn" size={12} />
                            Вход: {formatDateTime(s.createdAt)}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Icon name="Clock" size={12} />
                            Активность: {formatLastSeen(s.lastSeenAt)}
                          </div>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        disabled={busyId === s.id || s.isCurrent}
                        onClick={() =>
                          terminate(
                            { action: 'terminate_session', sessionId: s.id },
                            s.id
                          )
                        }
                      >
                        {busyId === s.id ? '...' : 'Выйти'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {employee && sessions.some((s) => !s.isCurrent) && (
                <Button
                  variant="outline"
                  className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                  disabled={busyAll}
                  onClick={() =>
                    terminate({
                      action: 'terminate_user',
                      userId: employee.userId,
                    })
                  }
                >
                  <Icon name="LogOut" size={15} className="mr-2" />
                  {busyAll ? 'Завершение...' : 'Завершить все сессии'}
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SessionsDialog;
