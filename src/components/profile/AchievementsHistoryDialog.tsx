import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import funcUrls from '../../../backend/func2url.json';

const ACHIEVEMENTS_URL = (funcUrls as Record<string, string>)['achievements'];

interface HistoryItem {
  id: number;
  user_email: string;
  user_full_name: string | null;
  user_role: string | null;
  user_photo_url: string | null;
  granted_by_email: string;
  granted_by_name: string | null;
  granted_at: string;
  comment: string | null;
  type_id: number;
  title: string;
  emoji: string;
  color: string;
}

interface AchievementsHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actorEmail: string;
  onChanged?: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  director: 'Директор',
  producer: 'Продюсер',
  operator: 'Оператор',
  content_maker: 'Контент-мейкер',
  solo_maker: 'Соло-мейкер',
  manager: 'Менеджер',
  model: 'Модель',
};

const parseUtc = (iso: string): Date => {
  let s = iso.replace(' ', 'T');
  if (!/[zZ]|[+-]\d{2}:?\d{2}$/.test(s)) s += 'Z';
  return new Date(s);
};

const formatDate = (iso: string): string => {
  try {
    const d = parseUtc(iso);
    return d.toLocaleString('ru-RU', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

const initials = (name?: string | null, email?: string) =>
  (name || email || '?')
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2);

export default function AchievementsHistoryDialog({
  open,
  onOpenChange,
  actorEmail,
  onChanged,
}: AchievementsHistoryDialogProps) {
  const { toast } = useToast();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [revokingId, setRevokingId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken') || '';
      const res = await fetch(`${ACHIEVEMENTS_URL}?action=history`, {
        headers: { 'X-Auth-Token': token, 'X-User-Email': actorEmail },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Не удалось загрузить');
      setItems(Array.isArray(data.history) ? data.history : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка';
      toast({ title: 'Не удалось загрузить историю', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (h) =>
        (h.user_full_name || '').toLowerCase().includes(q) ||
        h.user_email.toLowerCase().includes(q) ||
        h.title.toLowerCase().includes(q) ||
        (h.granted_by_name || h.granted_by_email).toLowerCase().includes(q),
    );
  }, [items, search]);

  const handleRevoke = async (id: number) => {
    if (!confirm('Отозвать это достижение?')) return;
    setRevokingId(id);
    try {
      const token = localStorage.getItem('authToken') || '';
      const res = await fetch(ACHIEVEMENTS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token,
          'X-User-Email': actorEmail,
        },
        body: JSON.stringify({ action: 'revoke', id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Ошибка');
      }
      toast({ title: 'Достижение отозвано' });
      setItems((prev) => prev.filter((x) => x.id !== id));
      onChanged?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось отозвать';
      toast({ title: 'Ошибка', description: message, variant: 'destructive' });
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0 flex flex-col gap-0">
        <DialogHeader className="px-6 pt-6 pb-3 border-b shrink-0">
          <DialogTitle className="font-heading">История достижений</DialogTitle>
          <DialogDescription>Все выданные достижения. Можно отозвать любое.</DialogDescription>
        </DialogHeader>

        <div className="px-6 pt-4 pb-3 shrink-0 border-b">
          <Input
            placeholder="Поиск по сотруднику, достижению или автору..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex-1 min-h-0 flex flex-col px-6 pt-3 pb-2">
          <ScrollArea className="flex-1 min-h-0 pr-2 border rounded-md">
            {loading ? (
              <p className="text-sm text-muted-foreground p-4">Загрузка...</p>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {items.length === 0 ? 'Никому ничего ещё не выдавали' : 'Ничего не найдено'}
              </p>
            ) : (
              <div className="divide-y">
                {filtered.map((h) => (
                  <div key={h.id} className="flex items-start gap-3 p-3">
                    <Avatar className="w-9 h-9 mt-0.5">
                      <AvatarImage src={h.user_photo_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {initials(h.user_full_name, h.user_email)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">
                          {h.user_full_name || h.user_email}
                        </p>
                        {h.user_role && (
                          <span className="text-[10px] uppercase tracking-wide bg-muted px-1.5 py-0.5 rounded">
                            {ROLE_LABELS[h.user_role] || h.user_role}
                          </span>
                        )}
                      </div>
                      <div
                        className={`mt-1.5 inline-flex items-center gap-2 rounded-lg border bg-gradient-to-br px-2 py-1 ${h.color}`}
                      >
                        <span className="text-base leading-none">{h.emoji}</span>
                        <span className="text-xs font-semibold">{h.title}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1.5 flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Icon name="User" size={11} />
                          {h.granted_by_name || h.granted_by_email}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Icon name="Calendar" size={11} />
                          {formatDate(h.granted_at)}
                        </span>
                      </div>
                      {h.comment && (
                        <p className="text-xs italic text-muted-foreground mt-1">«{h.comment}»</p>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevoke(h.id)}
                      disabled={revokingId === h.id}
                      className="text-destructive hover:text-destructive"
                    >
                      {revokingId === h.id ? (
                        <Icon name="Loader2" size={14} className="animate-spin" />
                      ) : (
                        <Icon name="X" size={14} />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {!loading && (
          <div className="border-t px-6 py-3 shrink-0 bg-background">
            <p className="text-xs text-muted-foreground text-right">
              Всего: {filtered.length}
              {filtered.length !== items.length && ` из ${items.length}`}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}