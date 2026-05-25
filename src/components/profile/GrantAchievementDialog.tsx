import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import funcUrls from '../../../backend/func2url.json';

const ACHIEVEMENTS_URL = (funcUrls as Record<string, string>)['achievements'];

interface AchievementType {
  id: number;
  title: string;
  description: string | null;
  emoji: string;
  color: string;
  is_active: boolean;
}

interface GrantAchievementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetEmail: string;
  targetName?: string;
  actorEmail: string;
  actorRole: string;
  onGranted?: () => void;
}

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
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isProducer = actorRole === 'producer';

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([
      fetch(`${ACHIEVEMENTS_URL}?action=types`).then((r) => r.json()),
      isProducer
        ? fetch(`${ACHIEVEMENTS_URL}?action=allowed_for_producer`).then((r) => r.json())
        : Promise.resolve({ allowed_ids: [] }),
    ])
      .then(([t, a]) => {
        setTypes(Array.isArray(t.types) ? t.types.filter((x: AchievementType) => x.is_active) : []);
        setAllowedIds(Array.isArray(a.allowed_ids) ? a.allowed_ids : []);
      })
      .catch(() => {
        toast({ title: 'Не удалось загрузить', variant: 'destructive' });
      })
      .finally(() => setLoading(false));
  }, [open, isProducer, toast]);

  const visibleTypes = isProducer ? types.filter((t) => allowedIds.includes(t.id)) : types;

  const handleGrant = async () => {
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
          user_email: targetEmail,
          type_id: selectedId,
          comment: comment.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка');
      toast({ title: 'Достижение выдано', description: targetName || targetEmail });
      setSelectedId(null);
      setComment('');
      onGranted?.();
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось выдать';
      toast({ title: 'Ошибка', description: message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">Назначить достижение</DialogTitle>
          <DialogDescription>
            {targetName || targetEmail}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Label>Выбери достижение</Label>
          {loading ? (
            <p className="text-sm text-muted-foreground">Загрузка...</p>
          ) : visibleTypes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {isProducer ? 'Директор пока не разрешил тебе выдавать достижения' : 'Нет доступных достижений'}
            </p>
          ) : (
            <ScrollArea className="h-[40vh] pr-2">
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
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.description}</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}

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

          <Button onClick={handleGrant} disabled={submitting || !selectedId} className="w-full">
            {submitting ? (
              <><Icon name="Loader2" size={16} className="mr-2 animate-spin" />Назначение...</>
            ) : (
              <><Icon name="Award" size={16} className="mr-2" />Выдать достижение</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
