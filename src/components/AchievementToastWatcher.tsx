import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import funcUrls from '../../backend/func2url.json';

const ACHIEVEMENTS_URL = (funcUrls as Record<string, string>)['achievements'];
const POLL_MS = 30_000;

interface UnseenAchievement {
  id: number;
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

const playChime = () => {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    const notes = [
      { f: 660, t: 0 },
      { f: 880, t: 0.08 },
      { f: 1175, t: 0.16 },
    ];
    notes.forEach(({ f, t }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0, now + t);
      gain.gain.linearRampToValueAtTime(0.18, now + t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + t);
      osc.stop(now + t + 0.4);
    });
    setTimeout(() => ctx.close().catch(() => {}), 900);
  } catch {
    // молча
  }
};

export default function AchievementToastWatcher() {
  const [queue, setQueue] = useState<UnseenAchievement[]>([]);
  const [current, setCurrent] = useState<UnseenAchievement | null>(null);
  const shownIds = useRef<Set<number>>(new Set());
  const pollingRef = useRef<number | null>(null);

  const userEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') || '' : '';
  const isAuth = typeof window !== 'undefined' ? localStorage.getItem('isAuthenticated') === 'true' : false;

  useEffect(() => {
    if (!isAuth || !userEmail) return;

    const fetchUnseen = async () => {
      try {
        const res = await fetch(`${ACHIEVEMENTS_URL}?action=unseen&email=${encodeURIComponent(userEmail)}`);
        if (!res.ok) return;
        const data = await res.json();
        const list: UnseenAchievement[] = Array.isArray(data.unseen) ? data.unseen : [];
        const fresh = list.filter((a) => !shownIds.current.has(a.id));
        if (fresh.length > 0) {
          fresh.forEach((a) => shownIds.current.add(a.id));
          setQueue((prev) => [...prev, ...fresh]);
        }
      } catch {
        // молча
      }
    };

    fetchUnseen();
    pollingRef.current = window.setInterval(fetchUnseen, POLL_MS);
    return () => {
      if (pollingRef.current) window.clearInterval(pollingRef.current);
    };
  }, [isAuth, userEmail]);

  useEffect(() => {
    if (!current && queue.length > 0) {
      const [next, ...rest] = queue;
      setCurrent(next);
      setQueue(rest);
      playChime();
    }
  }, [queue, current]);

  const markSeen = async (id: number) => {
    try {
      const token = localStorage.getItem('authToken') || '';
      await fetch(ACHIEVEMENTS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token,
          'X-User-Email': userEmail,
        },
        body: JSON.stringify({ action: 'mark_seen', user_email: userEmail, ids: [id] }),
      });
    } catch {
      // молча
    }
  };

  const handleClose = (open: boolean) => {
    if (open) return;
    if (current) {
      markSeen(current.id);
    }
    setCurrent(null);
  };

  if (!current) return null;

  return (
    <Dialog open={!!current} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 bg-transparent shadow-2xl">
        <div className={`relative rounded-2xl border bg-gradient-to-br ${current.color} p-6 backdrop-blur-md`}>
          <div className="absolute -top-1 left-0 right-0 flex justify-center pointer-events-none select-none text-3xl">
            <span className="animate-bounce delay-0">✨</span>
            <span className="animate-bounce delay-100 mx-2">🎉</span>
            <span className="animate-bounce delay-200">✨</span>
          </div>

          <div className="flex flex-col items-center text-center pt-4">
            <div className="text-7xl mb-3 animate-[pulse_1.5s_ease-in-out_infinite]">
              {current.emoji}
            </div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">
              Новое достижение
            </p>
            <h2 className="text-2xl font-bold font-heading text-foreground">
              {current.title}
            </h2>
            {current.description && (
              <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                {current.description}
              </p>
            )}

            <div className="mt-4 pt-4 border-t border-border/40 w-full space-y-1.5">
              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Icon name="User" size={12} />
                <span>
                  От: {current.granted_by_name || current.granted_by_email}
                </span>
              </div>
              {current.comment && (
                <p className="text-sm italic text-foreground/80">«{current.comment}»</p>
              )}
            </div>

            <Button onClick={() => handleClose(false)} className="mt-5 w-full">
              <Icon name="Sparkles" size={16} className="mr-2" />
              Принять
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
