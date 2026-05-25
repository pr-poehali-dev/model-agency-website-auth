import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import funcUrls from '../../../backend/func2url.json';

const ACHIEVEMENTS_URL = (funcUrls as Record<string, string>)['achievements'];
const AUTH_URL = (funcUrls as Record<string, string>)['auth'];

interface AchievementType {
  id: number;
  title: string;
  description: string | null;
  emoji: string;
  color: string;
  is_active: boolean;
}

interface UserOption {
  email: string;
  fullName?: string;
  role: string;
  photoUrl?: string;
  isActive?: boolean;
}

interface GrantAchievementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetEmail?: string;
  targetName?: string;
  actorEmail: string;
  actorRole: string;
  onGranted?: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  director: 'Директор',
  producer: 'Продюсер',
  operator: 'Оператор',
  content_maker: 'Контент-мейкер',
  solo_maker: 'Соло-мейкер',
  manager: 'Менеджер',
  content: 'Контент',
  model: 'Модель',
};

const getInitials = (name?: string, email?: string) =>
  (name || email || '?')
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2);

export default function GrantAchievementDialog({
  open,
  onOpenChange,
  targetEmail,
  targetName,
  actorEmail,
  actorRole,
  onGranted,
}: GrantAchievementDialogProps) {
  const { toast } = useToast();
  const [types, setTypes] = useState<AchievementType[]>([]);
  const [allowedIds, setAllowedIds] = useState<number[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<string>('');
  const [search, setSearch] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isProducer = actorRole === 'producer';
  const isDirector = actorRole === 'director';
  const needsUserPicker = !targetEmail;

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setSelectedEmail(targetEmail || '');
    setSelectedId(null);
    setComment('');
    setSearch('');

    const token = localStorage.getItem('authToken') || '';
    const requests: Array<Promise<unknown>> = [
      fetch(`${ACHIEVEMENTS_URL}?action=types`).then((r) => r.json()),
      isProducer
        ? fetch(`${ACHIEVEMENTS_URL}?action=allowed_for_producer`).then((r) => r.json())
        : Promise.resolve({ allowed_ids: [] }),
    ];
    if (needsUserPicker) {
      requests.push(
        fetch(AUTH_URL, {
          method: 'GET',
          headers: { 'X-Auth-Token': token, 'X-User-Email': actorEmail },
        }).then((r) => r.json()),
      );
    }

    Promise.all(requests)
      .then((results) => {
        const t = results[0] as { types?: AchievementType[] };
        const a = results[1] as { allowed_ids?: number[] };
        setTypes(Array.isArray(t.types) ? t.types.filter((x) => x.is_active) : []);
        setAllowedIds(Array.isArray(a.allowed_ids) ? a.allowed_ids : []);
        if (needsUserPicker) {
          const u = results[2] as UserOption[] | { error?: string };
          if (Array.isArray(u)) {
            const filtered = u
              .filter((x) => x.email && x.email.toLowerCase() !== actorEmail.toLowerCase())
              .filter((x) => x.isActive !== false);
            setUsers(filtered);
          }
        }
      })
      .catch(() => {
        toast({ title: 'Не удалось загрузить', variant: 'destructive' });
      })
      .finally(() => setLoading(false));
  }, [open, isProducer, needsUserPicker, actorEmail, targetEmail, toast]);

  const visibleTypes = isProducer ? types.filter((t) => allowedIds.includes(t.id)) : types;

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = users;
    if (isProducer) {
      list = list.filter((u) => ['operator', 'content_maker', 'solo_maker'].includes(u.role));
    }
    if (!q) return list;
    return list.filter(
      (u) =>
        (u.fullName || '').toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (ROLE_LABELS[u.role] || '').toLowerCase().includes(q),
    );
  }, [users, search, isProducer]);

  const handleGrant = async () => {
    const finalEmail = (targetEmail || selectedEmail).trim();
    if (!finalEmail) {
      toast({ title: 'Выбери сотрудника', variant: 'destructive' });
      return;
    }
    if (!selectedId) {
      toast({ title: 'Выбери достижение', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('authToken') || '';
      const res = await fetch(ACHIEVEMENTS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token,
          'X-User-Email': actorEmail,
        },
        body: JSON.stringify({
          action: 'grant',
          user_email: finalEmail,
          type_id: selectedId,
          comment: comment.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка');
      const picked = users.find((u) => u.email === finalEmail);
      toast({
        title: 'Достижение выдано',
        description: picked?.fullName || targetName || finalEmail,
      });
      setSelectedId(null);
      setComment('');
      setSelectedEmail(targetEmail || '');
      onGranted?.();
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось выдать';
      toast({ title: 'Ошибка', description: message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const headerSubtitle = targetEmail
    ? targetName || targetEmail
    : isDirector
    ? 'Выбери сотрудника и достижение'
    : 'Выбери своего сотрудника и достижение';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0 flex flex-col gap-0">
        <DialogHeader className="px-6 pt-6 pb-3 border-b shrink-0">
          <DialogTitle className="font-heading">Назначить достижение</DialogTitle>
          <DialogDescription>{headerSubtitle}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-0">
          {needsUserPicker && (
            <div className="space-y-2">
              <Label>Сотрудник</Label>
              <Input
                placeholder="Поиск по имени, email или роли..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <ScrollArea className="h-56 pr-2 border rounded-md">
                {loading ? (
                  <p className="text-sm text-muted-foreground p-3">Загрузка...</p>
                ) : filteredUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    {isProducer ? 'Нет доступных сотрудников' : 'Никого не найдено'}
                  </p>
                ) : (
                  <div className="divide-y">
                    {filteredUsers.map((u) => {
                      const active = selectedEmail === u.email;
                      return (
                        <button
                          key={u.email}
                          type="button"
                          onClick={() => setSelectedEmail(u.email)}
                          className={`w-full flex items-center gap-3 p-2.5 text-left transition ${
                            active ? 'bg-primary/10' : 'hover:bg-muted/40'
                          }`}
                        >
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={u.photoUrl} />
                            <AvatarFallback className="text-xs">
                              {getInitials(u.fullName, u.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{u.fullName || u.email}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {ROLE_LABELS[u.role] || u.role} · {u.email}
                            </p>
                          </div>
                          {active && <Icon name="Check" size={16} className="text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}

          <div className="space-y-2">
            <Label>Достижение</Label>
            {loading ? (
              <p className="text-sm text-muted-foreground">Загрузка...</p>
            ) : visibleTypes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                {isProducer
                  ? 'Директор пока не разрешил тебе выдавать достижения'
                  : 'Нет доступных достижений'}
              </p>
            ) : (
              <ScrollArea className="h-56 pr-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {visibleTypes.map((t) => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => setSelectedId(t.id)}
                      className={`text-left rounded-xl border bg-gradient-to-br p-3 transition ${t.color} ${
                        selectedId === t.id ? 'ring-2 ring-primary scale-[1.02]' : 'hover:scale-[1.01]'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-2xl leading-none">{t.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{t.title}</p>
                          {t.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                              {t.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="grant-comment">Комментарий (необязательно)</Label>
            <Textarea
              id="grant-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              placeholder="За что именно?"
            />
          </div>
        </div>

        <div className="border-t px-6 py-4 shrink-0 bg-background">
          <Button
            onClick={handleGrant}
            disabled={submitting || !selectedId || (needsUserPicker && !selectedEmail)}
            className="w-full"
          >
            {submitting ? (
              <>
                <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                Назначение...
              </>
            ) : (
              <>
                <Icon name="Award" size={16} className="mr-2" />
                Выдать достижение
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}