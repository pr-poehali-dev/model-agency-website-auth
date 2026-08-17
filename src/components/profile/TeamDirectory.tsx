import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { authenticatedFetch } from '@/lib/api';

const USERS_API_URL = 'https://functions.poehali.dev/67fd6902-6170-487e-bb46-f6d14ec99066';

const ROLE_LABELS: Record<string, string> = {
  director: 'Директор',
  producer: 'Продюсер',
  operator: 'Оператор',
  model: 'Модель',
  content_maker: 'Контент-мейкер',
  solo_maker: 'Соло-мейкер',
};

interface TeamMember {
  email: string;
  full_name?: string;
  role: string;
  photo_url?: string;
  is_active?: boolean;
}

interface Props {
  currentUserEmail: string;
}

const TeamDirectory = ({ currentUserEmail }: Props) => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const resp = await authenticatedFetch(USERS_API_URL);
        if (!resp.ok) {
          if (!cancelled) setFailed(true);
          return;
        }
        const data = await resp.json();
        if (cancelled) return;
        setMembers(Array.isArray(data) ? data : []);
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members
      .filter((m) => m.is_active !== false)
      .filter((m) => m.email.toLowerCase() !== currentUserEmail.toLowerCase())
      .filter((m) => {
        if (!q) return true;
        const name = (m.full_name || '').toLowerCase();
        const role = (ROLE_LABELS[m.role] || m.role).toLowerCase();
        return name.includes(q) || m.email.toLowerCase().includes(q) || role.includes(q);
      })
      .sort((a, b) => (a.full_name || a.email).localeCompare(b.full_name || b.email, 'ru'));
  }, [members, search, currentUserEmail]);

  const initials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  return (
    <Card className="border-border/50 bg-secondary/30 backdrop-blur-sm md:col-span-2">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-foreground flex items-center gap-2 font-heading">
            <Icon name="Users" size={20} className="text-primary" />
            Команда
          </CardTitle>
          <div className="relative w-full sm:w-64">
            <Icon
              name="Search"
              size={15}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по имени или роли"
              className="pl-8 h-9"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 text-center text-muted-foreground text-sm">Загрузка...</div>
        ) : failed ? (
          <div className="py-8 text-center text-muted-foreground text-sm">
            Не удалось загрузить список сотрудников
          </div>
        ) : visible.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-sm">
            {search ? 'Никого не найдено' : 'Других сотрудников пока нет'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {visible.map((m) => {
              const name = m.full_name || m.email;
              return (
                <button
                  key={m.email}
                  type="button"
                  onClick={() => navigate(`/profile/${encodeURIComponent(m.email)}`)}
                  className="flex items-center gap-3 rounded-lg border border-border/40 bg-background/40 p-2.5 text-left transition-colors hover:bg-background/80 hover:border-primary/40"
                >
                  <Avatar className="h-10 w-10 border border-border/50 shrink-0">
                    <AvatarImage src={m.photo_url || ''} alt={name} />
                    <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                      {initials(name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground truncate">{name}</div>
                    <Badge
                      variant="outline"
                      className="mt-0.5 text-[10px] py-0 px-1.5 border-border/50 text-muted-foreground"
                    >
                      {ROLE_LABELS[m.role] || m.role}
                    </Badge>
                  </div>
                  <Icon name="ChevronRight" size={16} className="text-muted-foreground shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TeamDirectory;
