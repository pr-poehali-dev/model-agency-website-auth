import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

export interface EmployeeStatus {
  userId: number;
  email: string;
  fullName?: string;
  role: string;
  photoUrl?: string;
  sessionCount: number;
  online: boolean;
  lastSeenAt: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  director: 'Директор',
  producer: 'Продюсер',
  operator: 'Оператор',
  model: 'Модель',
  content_maker: 'Контент-мейкер',
  solo_maker: 'Соло-мейкер',
};

export const formatLastSeen = (iso: string | null): string => {
  if (!iso) return 'ни разу не заходил';

  const date = new Date(iso);
  if (isNaN(date.getTime())) return 'неизвестно';

  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'только что';
  if (diffMin < 60) return `${diffMin} мин назад`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} ч назад`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'вчера';
  if (diffDays < 7) return `${diffDays} дн назад`;

  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

interface Props {
  employees: EmployeeStatus[];
  isLoading: boolean;
  onSelect: (employee: EmployeeStatus) => void;
}

const EmployeeStatusList = ({ employees, isLoading, onSelect }: Props) => {
  if (isLoading) {
    return (
      <Card className="p-8 text-center text-muted-foreground">Загрузка...</Card>
    );
  }

  if (employees.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        Сотрудников нет
      </Card>
    );
  }

  const initials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {employees.map((e) => {
        const name = e.fullName || e.email;
        return (
          <button
            key={e.userId}
            type="button"
            onClick={() => onSelect(e)}
            className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:border-primary/40 hover:bg-background/80 ${
              e.online
                ? 'border-green-500/40 bg-green-500/5'
                : 'border-border/50 bg-background/40'
            }`}
          >
            <div className="relative shrink-0">
              <Avatar className="h-11 w-11 border border-border/50">
                <AvatarImage src={e.photoUrl || ''} alt={name} />
                <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
                  {initials(name)}
                </AvatarFallback>
              </Avatar>
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background ${
                  e.online ? 'bg-green-500' : 'bg-muted-foreground/40'
                }`}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold text-foreground">
                  {name}
                </span>
                <Badge
                  variant="outline"
                  className="shrink-0 border-border/50 px-1.5 py-0 text-[10px] text-muted-foreground"
                >
                  {ROLE_LABELS[e.role] || e.role}
                </Badge>
              </div>
              <div className="mt-0.5 text-xs">
                {e.online ? (
                  <span className="font-medium text-green-600 dark:text-green-400">
                    В сети
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    Не в сети · {formatLastSeen(e.lastSeenAt)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {e.sessionCount > 0 && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Icon name="MonitorSmartphone" size={13} />
                  {e.sessionCount}
                </span>
              )}
              <Icon
                name="ChevronRight"
                size={16}
                className="text-muted-foreground"
              />
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default EmployeeStatusList;
