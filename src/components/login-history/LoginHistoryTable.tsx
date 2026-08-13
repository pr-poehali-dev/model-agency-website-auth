import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

export interface LoginRecord {
  id: number;
  email: string;
  fullName?: string | null;
  role?: string | null;
  ip?: string | null;
  device?: string | null;
  browser?: string | null;
  success: boolean;
  createdAt: string | null;
}

interface LoginHistoryTableProps {
  items: LoginRecord[];
  isLoading: boolean;
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

const LoginHistoryTable = ({ items, isLoading }: LoginHistoryTableProps) => {
  if (isLoading) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        Загрузка истории входов...
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        Записей не найдено
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
              <th className="px-4 py-3 text-left font-medium">Дата и время</th>
              <th className="px-4 py-3 text-left font-medium">Устройство</th>
              <th className="px-4 py-3 text-left font-medium">Браузер</th>
              <th className="px-4 py-3 text-left font-medium">IP-адрес</th>
              <th className="px-4 py-3 text-left font-medium">Результат</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="font-medium">{item.fullName || item.email}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.email}
                    {item.role ? ` · ${ROLE_LABELS[item.role] || item.role}` : ''}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {formatDateTime(item.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-2">
                    <Icon
                      name={DEVICE_ICONS[item.device || ''] || 'HelpCircle'}
                      size={16}
                    />
                    {item.device || '—'}
                  </span>
                </td>
                <td className="px-4 py-3">{item.browser || '—'}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {item.ip || '—'}
                </td>
                <td className="px-4 py-3">
                  {item.success ? (
                    <Badge variant="secondary">Успешно</Badge>
                  ) : (
                    <Badge variant="destructive">Неверный пароль</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default LoginHistoryTable;
