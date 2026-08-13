import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

export interface SessionRecord {
  id: number;
  userId: number;
  email: string;
  fullName?: string | null;
  role?: string | null;
  ip?: string | null;
  device?: string | null;
  browser?: string | null;
  createdAt: string | null;
  lastSeenAt: string | null;
  isCurrent: boolean;
}

interface SessionsTableProps {
  items: SessionRecord[];
  isLoading: boolean;
  terminatingId: number | null;
  onTerminate: (session: SessionRecord) => void;
}

const ROLE_LABELS: Record<string, string> = {
  director: 'Директор',
  producer: 'Продюссер',
  operator: 'Оператор',
  solo_maker: 'Соло-мейкер',
  content_maker: 'Контент-мейкер',
};

const DEVICE_ICONS: Record<string, string> = {
  'Телефон': 'Smartphone',
  'Планшет': 'Tablet',
  'Компьютер': 'Monitor',
};

const formatDateTime = (iso: string | null) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

const formatLastSeen = (iso: string | null) => {
  if (!iso) return '—';
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 0) return 'только что';
  if (diffMin < 1) return 'только что';
  if (diffMin < 60) return `${diffMin} мин. назад`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} ч. назад`;
  return formatDateTime(iso);
};

const isOnline = (iso: string | null) => {
  if (!iso) return false;
  return Date.now() - new Date(iso).getTime() < 15 * 60 * 1000;
};

const SessionsTable = ({
  items,
  isLoading,
  terminatingId,
  onTerminate,
}: SessionsTableProps) => {
  if (isLoading) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        Загрузка активных сессий...
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        Активных сессий нет
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Сотрудник</th>
              <th className="px-4 py-3 text-left font-medium">Статус</th>
              <th className="px-4 py-3 text-left font-medium">Устройство</th>
              <th className="px-4 py-3 text-left font-medium">Вход</th>
              <th className="px-4 py-3 text-left font-medium">Активность</th>
              <th className="px-4 py-3 text-left font-medium">IP-адрес</th>
              <th className="px-4 py-3 text-right font-medium">Действие</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="font-medium">
                    {item.fullName || item.email}
                    {item.isCurrent && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (вы)
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {item.email}
                    {item.role ? ` · ${ROLE_LABELS[item.role] || item.role}` : ''}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {isOnline(item.lastSeenAt) ? (
                    <Badge variant="secondary" className="gap-1">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      В сети
                    </Badge>
                  ) : (
                    <Badge variant="outline">Не активен</Badge>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-2">
                    <Icon
                      name={DEVICE_ICONS[item.device || ''] || 'HelpCircle'}
                      size={16}
                    />
                    {item.device || '—'}
                    {item.browser ? ` · ${item.browser}` : ''}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {formatDateTime(item.createdAt)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {formatLastSeen(item.lastSeenAt)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {item.ip || '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-2"
                    disabled={item.isCurrent || terminatingId === item.id}
                    onClick={() => onTerminate(item)}
                  >
                    <Icon name="LogOut" size={14} />
                    {terminatingId === item.id ? 'Завершение...' : 'Выйти'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default SessionsTable;
