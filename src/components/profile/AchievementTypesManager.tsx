import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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

interface AchievementTypesManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actorEmail: string;
}

const COLOR_PRESETS: { label: string; value: string; tone: string }[] = [
  { label: 'Янтарный', value: 'from-amber-500/20 to-yellow-500/20 border-amber-500/30', tone: 'bg-amber-500/30' },
  { label: 'Зелёный', value: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30', tone: 'bg-emerald-500/30' },
  { label: 'Оранжевый', value: 'from-orange-500/20 to-red-500/20 border-orange-500/30', tone: 'bg-orange-500/30' },
  { label: 'Синий', value: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30', tone: 'bg-blue-500/30' },
  { label: 'Фиолетовый', value: 'from-purple-500/20 to-violet-500/20 border-purple-500/30', tone: 'bg-purple-500/30' },
  { label: 'Розовый', value: 'from-pink-500/20 to-rose-500/20 border-pink-500/30', tone: 'bg-pink-500/30' },
];

const authHeaders = (email: string): Record<string, string> => {
  const token = localStorage.getItem('authToken') || '';
  return {
    'Content-Type': 'application/json',
    'X-Auth-Token': token,
    'X-User-Email': email,
  };
};

export default function AchievementTypesManager({ open, onOpenChange, actorEmail }: AchievementTypesManagerProps) {
  const { toast } = useToast();
  const [types, setTypes] = useState<AchievementType[]>([]);
  const [allowedIds, setAllowedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('🏆');
  const [color, setColor] = useState(COLOR_PRESETS[0].value);

  const load = async () => {
    setLoading(true);
    try {
      const [tRes, aRes] = await Promise.all([
        fetch(`${ACHIEVEMENTS_URL}?action=types`).then((r) => r.json()),
        fetch(`${ACHIEVEMENTS_URL}?action=allowed_for_producer`).then((r) => r.json()),
      ]);
      setTypes(Array.isArray(tRes.types) ? tRes.types : []);
      setAllowedIds(Array.isArray(aRes.allowed_ids) ? aRes.allowed_ids : []);
    } catch {
      toast({ title: 'Не удалось загрузить', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  const handleCreate = async () => {
    if (!title.trim()) {
      toast({ title: 'Укажи название', variant: 'destructive' });
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(ACHIEVEMENTS_URL, {
        method: 'POST',
        headers: authHeaders(actorEmail),
        body: JSON.stringify({
          action: 'create_type',
          title: title.trim(),
          description: description.trim(),
          emoji: emoji.trim() || '🏆',
          color,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ошибка');
      toast({ title: 'Достижение создано' });
      setTitle('');
      setDescription('');
      setEmoji('🏆');
      setColor(COLOR_PRESETS[0].value);
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось создать';
      toast({ title: 'Ошибка', description: message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleDeactivate = async (id: number) => {
    try {
      const res = await fetch(ACHIEVEMENTS_URL, {
        method: 'POST',
        headers: authHeaders(actorEmail),
        body: JSON.stringify({ action: 'deactivate_type', id }),
      });
      if (!res.ok) throw new Error();
      toast({ title: 'Тип скрыт' });
      await load();
    } catch {
      toast({ title: 'Не удалось скрыть', variant: 'destructive' });
    }
  };

  const toggleAllowed = (id: number) => {
    setAllowedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const saveAllowed = async () => {
    try {
      const res = await fetch(ACHIEVEMENTS_URL, {
        method: 'POST',
        headers: authHeaders(actorEmail),
        body: JSON.stringify({ action: 'set_producer_allowed', ids: allowedIds }),
      });
      if (!res.ok) throw new Error();
      toast({ title: 'Разрешения сохранены' });
    } catch {
      toast({ title: 'Не удалось сохранить', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-heading">Управление достижениями</DialogTitle>
          <DialogDescription>Создавай типы достижений и настраивай, что могут выдавать продюсеры</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="list" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="list">Список</TabsTrigger>
            <TabsTrigger value="create">Создать</TabsTrigger>
            <TabsTrigger value="allowed">Продюсеры</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="flex-1 overflow-hidden mt-3">
            <ScrollArea className="h-[55vh] pr-3">
              {loading ? (
                <p className="text-sm text-muted-foreground">Загрузка...</p>
              ) : types.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Типов пока нет</p>
              ) : (
                <div className="space-y-2">
                  {types.map((t) => (
                    <Card key={t.id} className={`p-3 border bg-gradient-to-br ${t.color} ${!t.is_active ? 'opacity-50' : ''}`}>
                      <div className="flex items-start gap-3">
                        <span className="text-2xl leading-none">{t.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground">{t.title}</p>
                          {t.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                          )}
                        </div>
                        {t.is_active && (
                          <Button variant="ghost" size="sm" onClick={() => handleDeactivate(t.id)}>
                            <Icon name="EyeOff" size={14} />
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="create" className="flex-1 overflow-auto mt-3 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="ach-title">Название</Label>
              <Input id="ach-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Например: Лучший оператор недели" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ach-desc">Описание</Label>
              <Textarea id="ach-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ach-emoji">Эмодзи</Label>
                <Input id="ach-emoji" value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={4} className="text-2xl text-center" />
              </div>
              <div className="space-y-1.5">
                <Label>Превью</Label>
                <div className={`rounded-lg border bg-gradient-to-br p-3 ${color} flex items-center gap-2`}>
                  <span className="text-2xl">{emoji}</span>
                  <span className="text-sm font-semibold truncate">{title || 'Название'}</span>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Цвет</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className={`w-9 h-9 rounded-full ${c.tone} border-2 transition ${
                      color === c.value ? 'border-primary scale-110' : 'border-transparent'
                    }`}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
            <Button onClick={handleCreate} disabled={creating} className="w-full">
              {creating ? (
                <><Icon name="Loader2" size={16} className="mr-2 animate-spin" />Создание...</>
              ) : (
                <><Icon name="Plus" size={16} className="mr-2" />Создать достижение</>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="allowed" className="flex-1 overflow-hidden mt-3 flex flex-col">
            <p className="text-sm text-muted-foreground mb-2">
              Отметь достижения, которые продюсер сможет выдавать своим сотрудникам.
            </p>
            <ScrollArea className="h-[45vh] pr-3 flex-1">
              <div className="space-y-2">
                {types.filter((t) => t.is_active).map((t) => (
                  <label
                    key={t.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40 cursor-pointer"
                  >
                    <Checkbox
                      checked={allowedIds.includes(t.id)}
                      onCheckedChange={() => toggleAllowed(t.id)}
                    />
                    <span className="text-xl">{t.emoji}</span>
                    <span className="text-sm flex-1">{t.title}</span>
                  </label>
                ))}
              </div>
            </ScrollArea>
            <Button onClick={saveAllowed} className="mt-3">
              <Icon name="Check" size={16} className="mr-2" />
              Сохранить разрешения
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
