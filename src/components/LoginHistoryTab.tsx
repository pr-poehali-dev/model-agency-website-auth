import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { authenticatedFetch } from '@/lib/api';
import { API_URLS } from '@/lib/apiUrls';
import LoginHistoryFilters, {
  UserOption,
} from './login-history/LoginHistoryFilters';
import LoginHistoryTable, {
  LoginRecord,
} from './login-history/LoginHistoryTable';

const PAGE_SIZE = 100;

const LoginHistoryTab = () => {
  const [items, setItems] = useState<LoginRecord[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);

  const [selectedEmail, setSelectedEmail] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { toast } = useToast();

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedEmail && selectedEmail !== 'all') {
        params.set('email', selectedEmail);
      }
      if (dateFrom) params.set('date_from', dateFrom);
      if (dateTo) params.set('date_to', dateTo);
      params.set('limit', String(PAGE_SIZE));
      params.set('offset', String(page * PAGE_SIZE));

      const res = await authenticatedFetch(
        `${API_URLS.loginHistory}?${params.toString()}`,
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Не удалось загрузить историю');
      }

      setItems(data.items || []);
      setTotal(data.total || 0);
      setUsers(data.users || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка загрузки';
      toast({ title: 'Ошибка', description: msg, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedEmail, dateFrom, dateTo, page, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleReset = () => {
    setSelectedEmail('all');
    setDateFrom('');
    setDateTo('');
    setPage(0);
  };

  const handleFilterChange = (setter: (v: string) => void) => (value: string) => {
    setter(value);
    setPage(0);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">История входов</h2>
          <p className="text-sm text-muted-foreground">
            Кто, когда и с какого устройства заходил в систему
          </p>
        </div>
        <Button variant="outline" onClick={load} className="gap-2">
          <Icon name="RefreshCw" size={16} />
          Обновить
        </Button>
      </div>

      <LoginHistoryFilters
        users={users}
        selectedEmail={selectedEmail}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onEmailChange={handleFilterChange(setSelectedEmail)}
        onDateFromChange={handleFilterChange(setDateFrom)}
        onDateToChange={handleFilterChange(setDateTo)}
        onReset={handleReset}
      />

      <LoginHistoryTable items={items} isLoading={isLoading} />

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Всего записей: {total}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(p - 1, 0))}
            >
              Назад
            </Button>
            <span className="text-sm">
              {page + 1} из {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Вперёд
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginHistoryTab;
