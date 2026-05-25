import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import Icon from '@/components/ui/icon';
import funcUrls from '../../../backend/func2url.json';

const ACHIEVEMENTS_URL = (funcUrls as Record<string, string>)['achievements'];

export interface UserAchievement {
  id: number;
  user_email: string;
  granted_by_email: string;
  granted_by_name: string | null;
  granted_at: string;
  comment: string | null;
  type_id: number;
  title: string;
  description: string | null;
  emoji: string;
  color: string;
}

interface AchievementsSectionProps {
  userEmail: string;
  refreshKey?: number;
}

const formatDate = (iso: string): string => {
  try {
    const d = new Date(iso.replace(' ', 'T'));
    return d.toLocaleString('ru-RU', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

export default function AchievementsSection({ userEmail, refreshKey = 0 }: AchievementsSectionProps) {
  const [items, setItems] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userEmail) return;
    setLoading(true);
    fetch(`${ACHIEVEMENTS_URL}?action=user&email=${encodeURIComponent(userEmail)}`)
      .then((r) => r.json())
      .then((data) => {
        setItems(Array.isArray(data.achievements) ? data.achievements : []);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [userEmail, refreshKey]);

  return (
    <Card className="border-border/50 bg-secondary/30 backdrop-blur-sm md:col-span-2">
      <CardHeader className="pb-3">
        <CardTitle className="text-foreground flex items-center gap-2 font-heading">
          <Icon name="Trophy" size={20} className="text-primary" />
          Достижения
          {!loading && items.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">· {items.length}</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Icon name="Loader2" size={14} className="animate-spin" />
            Загрузка...
          </div>
        ) : items.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-6">
            Пока нет достижений. Они появятся, когда руководитель отметит твои успехи.
          </div>
        ) : (
          <TooltipProvider delayDuration={150}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {items.map((a) => (
                <Tooltip key={a.id}>
                  <TooltipTrigger asChild>
                    <div
                      className={`rounded-xl border bg-gradient-to-br p-4 ${a.color} transition-all hover:scale-[1.02] cursor-default`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-3xl leading-none">{a.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground">{a.title}</p>
                          {a.description && (
                            <p className="text-sm text-muted-foreground mt-0.5 leading-snug">
                              {a.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Icon name="User" size={12} />
                        <span>Присвоил: {a.granted_by_name || a.granted_by_email}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Icon name="Calendar" size={12} />
                        <span>{formatDate(a.granted_at)}</span>
                      </div>
                      {a.comment && (
                        <div className="pt-1 border-t border-border/40">
                          <span className="italic">«{a.comment}»</span>
                        </div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  );
}
