import { useEffect, useRef, useState, MouseEvent } from 'react';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { formatRelativeTime } from '@/lib/relativeTime';
import funcUrls from '../../../backend/func2url.json';

const ACHIEVEMENTS_URL = (funcUrls as Record<string, string>)['achievements'];

interface Achievement {
  id: number;
  granted_at: string;
  granted_by_name: string | null;
  granted_by_email: string;
  comment: string | null;
  title: string;
  description: string | null;
  emoji: string;
  color: string;
}

interface Props {
  userEmail?: string;
  onClick?: () => void;
}

interface Particle {
  id: number;
  emoji: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
  rot: number;
}

const CONFETTI_EMOJIS = ['🎉', '✨', '🎊', '⭐', '💫', '🌟'];

const LatestAchievementBadge = ({ userEmail, onClick }: Props) => {
  const [latest, setLatest] = useState<Achievement | null>(null);
  const [loading, setLoading] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    if (!userEmail || !ACHIEVEMENTS_URL) return;
    setLoading(true);
    fetch(`${ACHIEVEMENTS_URL}?action=user&email=${encodeURIComponent(userEmail)}`)
      .then((r) => r.json())
      .then((data) => {
        const list: Achievement[] = Array.isArray(data.achievements) ? data.achievements : [];
        setLatest(list[0] || null);
      })
      .catch(() => setLatest(null))
      .finally(() => setLoading(false));
  }, [userEmail]);

  const burstConfetti = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const parentRect = e.currentTarget.parentElement?.getBoundingClientRect();
    if (!parentRect) return;
    const cx = rect.left - parentRect.left + rect.width / 2;
    const cy = rect.top - parentRect.top + rect.height / 2;

    const fresh: Particle[] = Array.from({ length: 14 }).map(() => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 80;
      return {
        id: ++idRef.current,
        emoji: CONFETTI_EMOJIS[Math.floor(Math.random() * CONFETTI_EMOJIS.length)],
        x: cx,
        y: cy,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed - 40,
        rot: (Math.random() - 0.5) * 540,
      };
    });

    setParticles((p) => [...p, ...fresh]);
    const ids = new Set(fresh.map((f) => f.id));
    setTimeout(() => {
      setParticles((p) => p.filter((x) => !ids.has(x.id)));
    }, 1100);
  };

  if (loading || !latest) return null;

  return (
    <Card
      onClick={onClick}
      className={`p-4 border bg-gradient-to-br ${latest.color} relative overflow-hidden animate-fade-in ${
        onClick ? 'cursor-pointer hover:scale-[1.01] transition-transform' : ''
      }`}
    >
      <div
        className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 animate-badge-shimmer"
        aria-hidden
      />
      <div className="flex items-start gap-4 relative">
        <div
          role="button"
          tabIndex={0}
          onClick={burstConfetti}
          className="text-5xl leading-none shrink-0 animate-emoji-pulse origin-center cursor-pointer select-none active:scale-90 transition-transform"
          title="Кликни меня!"
        >
          {latest.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Icon name="Sparkles" size={14} className="text-primary animate-pulse" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Бейдж дня
            </span>
          </div>
          <p className="font-heading text-lg font-bold text-foreground leading-tight">
            {latest.title}
          </p>
          {latest.description && (
            <p className="text-sm text-muted-foreground mt-0.5 leading-snug">
              {latest.description}
            </p>
          )}
          {latest.comment && (
            <p className="text-xs italic text-muted-foreground mt-1.5">«{latest.comment}»</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Icon name="User" size={11} />
              {latest.granted_by_name || latest.granted_by_email}
            </span>
            <span className="flex items-center gap-1">
              <Icon name="Clock" size={11} />
              {formatRelativeTime(latest.granted_at)}
            </span>
          </div>
        </div>
      </div>

      {particles.length > 0 && (
        <div className="pointer-events-none absolute inset-0 overflow-visible">
          {particles.map((p) => (
            <span
              key={p.id}
              className="absolute text-2xl will-change-transform"
              style={{
                left: `${p.x}px`,
                top: `${p.y}px`,
                animation: 'confetti-fly 1s ease-out forwards',
                ['--dx' as string]: `${p.dx}px`,
                ['--dy' as string]: `${p.dy}px`,
                ['--rot' as string]: `${p.rot}deg`,
              }}
            >
              {p.emoji}
            </span>
          ))}
        </div>
      )}

      <style>{`
        @keyframes confetti-fly {
          0% { opacity: 1; transform: translate(-50%, -50%) rotate(0deg) scale(1); }
          100% { opacity: 0; transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy) + 120px)) rotate(var(--rot)) scale(0.6); }
        }
      `}</style>
    </Card>
  );
};

export default LatestAchievementBadge;