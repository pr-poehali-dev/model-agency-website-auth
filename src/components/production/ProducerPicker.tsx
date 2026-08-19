import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Icon from '@/components/ui/icon';
import { authenticatedFetchNoCreds } from '@/lib/api';
import funcUrls from '../../../backend/func2url.json';

const AUTH_URL = (funcUrls as Record<string, string>)['auth'];

export interface ProducerOption {
  email: string;
  name: string;
  photoUrl?: string;
}

interface ProducerPickerProps {
  directorEmail: string;
  onPick: (producer: ProducerOption) => void;
}

interface ApiUser {
  email: string;
  fullName?: string;
  role: string;
  photoUrl?: string;
  isActive?: boolean;
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

const ProducerPicker = ({ directorEmail, onPick }: ProducerPickerProps) => {
  const [producers, setProducers] = useState<ProducerOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await authenticatedFetchNoCreds(AUTH_URL);
        const users: ApiUser[] = await res.json();
        const list = (Array.isArray(users) ? users : [])
          .filter((u) => u.role === 'producer' && u.isActive !== false)
          .map((u) => ({
            email: u.email,
            name: u.fullName || u.email,
            photoUrl: u.photoUrl,
          }))
          .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
        setProducers(list);
      } catch {
        setProducers([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const cards: ProducerOption[] = [
    { email: directorEmail, name: 'Мой продакшн' },
    ...producers,
  ];

  if (loading) {
    return (
      <Card className="border-border/50 bg-secondary/30 backdrop-blur-sm">
        <CardContent className="py-10 text-center text-muted-foreground">Загрузка...</CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((producer, index) => (
        <button
          key={producer.email}
          type="button"
          onClick={() => onPick(producer)}
          className={`group flex items-center gap-3 rounded-xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.6)] ${
            index === 0
              ? 'border-primary/40 bg-primary/10'
              : 'border-border/50 bg-secondary/30 backdrop-blur-sm'
          }`}
        >
          {index === 0 ? (
            <div className="rounded-lg border border-primary/30 bg-background/40 p-2.5">
              <Icon name="Crown" size={22} className="text-primary" />
            </div>
          ) : (
            <Avatar className="h-11 w-11">
              <AvatarImage src={producer.photoUrl} loading="lazy" />
              <AvatarFallback>{initials(producer.name)}</AvatarFallback>
            </Avatar>
          )}
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold text-foreground">{producer.name}</div>
            <div className="truncate text-xs text-muted-foreground">
              {index === 0 ? 'Личный раздел' : 'Продюсер'}
            </div>
          </div>
          <Icon
            name="ChevronRight"
            size={18}
            className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1"
          />
        </button>
      ))}
    </div>
  );
};

export default ProducerPicker;
