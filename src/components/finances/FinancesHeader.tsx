import { Button } from '@/components/ui/button';

interface FinancesHeaderProps {
  dateFilter: 'week' | 'month' | 'quarter' | 'year';
  statusFilter: 'all' | 'paid' | 'pending';
  onDateFilterChange: (filter: 'week' | 'month' | 'quarter' | 'year') => void;
  onStatusFilterChange: (filter: 'all' | 'paid' | 'pending') => void;
}

const FinancesHeader = ({ dateFilter, statusFilter, onDateFilterChange, onStatusFilterChange }: FinancesHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h2 className="text-4xl font-serif font-bold text-foreground mb-2">Финансы</h2>
        <p className="text-muted-foreground">Статистика доходов и платформ</p>
      </div>
      
      <div className="flex flex-wrap gap-3">
        <div className="flex gap-2">
          <Button
            variant={dateFilter === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onDateFilterChange('week')}
          >
            Неделя
          </Button>
          <Button
            variant={dateFilter === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onDateFilterChange('month')}
          >
            Месяц
          </Button>
          <Button
            variant={dateFilter === 'quarter' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onDateFilterChange('quarter')}
          >
            Квартал
          </Button>
          <Button
            variant={dateFilter === 'year' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onDateFilterChange('year')}
          >
            Год
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onStatusFilterChange('all')}
          >
            Все
          </Button>
          <Button
            variant={statusFilter === 'paid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onStatusFilterChange('paid')}
          >
            Оплачено
          </Button>
          <Button
            variant={statusFilter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onStatusFilterChange('pending')}
          >
            Ожидание
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FinancesHeader;
