import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Period, getPreviousPeriod } from '@/utils/periodUtils';

interface ModelStats {
  name: string;
  email: string;
  current_income: number;
  previous_income: number;
  current_shifts: number;
  previous_shifts: number;
}

interface OperatorStats {
  name: string;
  email: string;
  current_shifts: number;
  previous_shifts: number;
}

interface Adjustment {
  email: string;
  role: string;
  advance: number;
  penalty: number;
  expenses: number;
}

interface ProducerData {
  producer_name?: string;
  producer_email?: string;
  models: ModelStats[];
  operators: OperatorStats[];
  adjustments: {
    current: Adjustment[];
    previous: Adjustment[];
  };
}

interface ProductionMonitoringProps {
  userEmail: string;
  userRole: string;
  period: Period;
  onPreviousPeriod: () => void;
  onNextPeriod: () => void;
}

const ProductionMonitoring = ({ userEmail, userRole, period, onPreviousPeriod, onNextPeriod }: ProductionMonitoringProps) => {
  const [data, setData] = useState<ProducerData | null>(null);
  const [producersData, setProducersData] = useState<ProducerData[]>([]);
  const [loading, setLoading] = useState(true);
  const API_URL = 'https://functions.poehali.dev/d82439a1-a9ac-4798-a02a-8874ce48e24b';

  useEffect(() => {
    loadData();
  }, [period, userEmail, userRole]);

  const loadData = async () => {
    setLoading(true);
    const previousPeriod = getPreviousPeriod(period);
    
    const periodStart = formatDate(period.startDate);
    const periodEnd = formatDate(period.endDate);

    try {
      const response = await fetch(
        `${API_URL}?user_email=${encodeURIComponent(userEmail)}&role=${userRole}&period_start=${periodStart}&period_end=${periodEnd}`
      );
      const result = await response.json();
      
      console.log('Production stats loaded:', result);
      
      if (userRole === 'director') {
        setProducersData(result.producers || []);
      } else {
        setData(result);
      }
    } catch (error) {
      console.error('Error loading production stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatRubles = (amount: number): string => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getDifference = (current: number, previous: number): string => {
    const diff = current - previous;
    if (diff === 0) return '0';
    const sign = diff > 0 ? '+' : '';
    return `${sign}${formatCurrency(diff)}`;
  };

  const getDifferenceRubles = (current: number, previous: number): string => {
    const diff = current - previous;
    if (diff === 0) return '0';
    const sign = diff > 0 ? '+' : '';
    return `${sign}${formatRubles(diff)}`;
  };

  const getDifferenceColor = (current: number, previous: number): string => {
    const diff = current - previous;
    if (diff > 0) return 'text-green-600';
    if (diff < 0) return 'text-red-600';
    return 'text-muted-foreground';
  };

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <Icon name="Loader2" size={32} className="mx-auto mb-4 text-primary animate-spin" />
        <p className="text-muted-foreground">Загрузка статистики...</p>
      </Card>
    );
  }

  const renderProducerStats = (producerData: ProducerData, isNested: boolean = false) => {
    const totalCurrentIncome = producerData.models.reduce((sum, m) => sum + m.current_income, 0);
    const totalPreviousIncome = producerData.models.reduce((sum, m) => sum + m.previous_income, 0);
    
    const totalCurrentShifts = producerData.operators.reduce((sum, o) => sum + o.current_shifts, 0) + producerData.models.reduce((sum, m) => sum + m.current_shifts, 0);
    const totalPreviousShifts = producerData.operators.reduce((sum, o) => sum + o.previous_shifts, 0) + producerData.models.reduce((sum, m) => sum + m.previous_shifts, 0);
    
    const currentAdvances = producerData.adjustments.current.reduce((sum, a) => sum + Number(a.advance), 0);
    const previousAdvances = producerData.adjustments.previous.reduce((sum, a) => sum + Number(a.advance), 0);
    
    const currentPenalties = producerData.adjustments.current.reduce((sum, a) => sum + Number(a.penalty), 0);
    const previousPenalties = producerData.adjustments.previous.reduce((sum, a) => sum + Number(a.penalty), 0);

    return (
      <div className="space-y-6">
        {isNested && (
          <div className="flex items-center gap-3 pb-4 border-b">
            <Icon name="User" size={24} className="text-primary" />
            <div>
              <h3 className="text-xl font-semibold">{producerData.producer_name}</h3>
              <p className="text-sm text-muted-foreground">{producerData.producer_email}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="DollarSign" size={20} className="text-green-600" />
              <span className="text-sm font-medium text-muted-foreground">Доход продакшена</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(totalCurrentIncome)}</div>
            <div className={`text-sm mt-1 ${getDifferenceColor(totalCurrentIncome, totalPreviousIncome)}`}>
              {getDifference(totalCurrentIncome, totalPreviousIncome)}
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="Calendar" size={20} className="text-emerald-600" />
              <span className="text-sm font-medium text-muted-foreground">Смены</span>
            </div>
            <div className="text-2xl font-bold">{totalCurrentShifts}</div>
            <div className={`text-sm mt-1 ${totalCurrentShifts >= totalPreviousShifts ? 'text-green-600' : 'text-red-600'}`}>
              {totalCurrentShifts - totalPreviousShifts >= 0 ? '+' : ''}{totalCurrentShifts - totalPreviousShifts}
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="TrendingUp" size={20} className="text-orange-600" />
              <span className="text-sm font-medium text-muted-foreground">Авансы</span>
            </div>
            <div className="text-2xl font-bold">{formatRubles(currentAdvances)}</div>
            <div className={`text-sm mt-1 ${getDifferenceColor(currentAdvances, previousAdvances)}`}>
              {getDifferenceRubles(currentAdvances, previousAdvances)}
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="AlertTriangle" size={20} className="text-red-600" />
              <span className="text-sm font-medium text-muted-foreground">Штрафы</span>
            </div>
            <div className="text-2xl font-bold">{formatRubles(currentPenalties)}</div>
            <div className={`text-sm mt-1 ${getDifferenceColor(currentPenalties, previousPenalties)}`}>
              {getDifferenceRubles(currentPenalties, previousPenalties)}
            </div>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <div className="bg-muted/50 px-6 py-4 border-b">
            <h3 className="font-semibold flex items-center gap-2">
              <Icon name="Users" size={20} />
              Модели ({producerData.models.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-4 font-medium">Имя</th>
                  <th className="text-right p-4 font-medium">Текущий период</th>
                  <th className="text-right p-4 font-medium">Прошлый период</th>
                  <th className="text-right p-4 font-medium">Разница</th>
                  <th className="text-center p-4 font-medium">Смены (тек.)</th>
                  <th className="text-center p-4 font-medium">Смены (пр.)</th>
                </tr>
              </thead>
              <tbody>
                {producerData.models.map((model, index) => (
                  <tr key={index} className="border-b hover:bg-muted/20 transition-colors">
                    <td className="p-4">
                      <div>
                        <div className="font-medium">{model.name}</div>
                        <div className="text-sm text-muted-foreground">{model.email}</div>
                      </div>
                    </td>
                    <td className="p-4 text-right font-medium">{formatCurrency(model.current_income)}</td>
                    <td className="p-4 text-right text-muted-foreground">{formatCurrency(model.previous_income)}</td>
                    <td className={`p-4 text-right font-medium ${getDifferenceColor(model.current_income, model.previous_income)}`}>
                      {getDifference(model.current_income, model.previous_income)}
                    </td>
                    <td className="p-4 text-center">
                      <Badge variant="secondary">{model.current_shifts}</Badge>
                    </td>
                    <td className="p-4 text-center">
                      <Badge variant="outline">{model.previous_shifts}</Badge>
                    </td>
                  </tr>
                ))}
                {producerData.models.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                      Нет назначенных моделей
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="bg-muted/50 px-6 py-4 border-b">
            <h3 className="font-semibold flex items-center gap-2">
              <Icon name="Headphones" size={20} />
              Операторы ({producerData.operators.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left p-4 font-medium">Имя</th>
                  <th className="text-center p-4 font-medium">Смены (текущий)</th>
                  <th className="text-center p-4 font-medium">Смены (прошлый)</th>
                  <th className="text-center p-4 font-medium">Разница</th>
                </tr>
              </thead>
              <tbody>
                {producerData.operators.map((operator, index) => (
                  <tr key={index} className="border-b hover:bg-muted/20 transition-colors">
                    <td className="p-4">
                      <div>
                        <div className="font-medium">{operator.name}</div>
                        <div className="text-sm text-muted-foreground">{operator.email}</div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <Badge variant="secondary">{operator.current_shifts}</Badge>
                    </td>
                    <td className="p-4 text-center">
                      <Badge variant="outline">{operator.previous_shifts}</Badge>
                    </td>
                    <td className={`p-4 text-center font-medium ${operator.current_shifts >= operator.previous_shifts ? 'text-green-600' : 'text-red-600'}`}>
                      {operator.current_shifts - operator.previous_shifts >= 0 ? '+' : ''}{operator.current_shifts - operator.previous_shifts}
                    </td>
                  </tr>
                ))}
                {producerData.operators.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                      Нет назначенных операторов
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  };

  if (userRole === 'director') {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-serif font-bold mb-2">Мониторинг производства</h2>
            <p className="text-muted-foreground">Статистика по всем продакшенам за период {period.label}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={onPreviousPeriod} variant="outline" size="sm">
              <Icon name="ChevronLeft" size={16} />
            </Button>
            <Button onClick={onNextPeriod} variant="outline" size="sm">
              <Icon name="ChevronRight" size={16} />
            </Button>
          </div>
        </div>

        {producersData.map((producerData, index) => (
          <Card key={index} className="p-6">
            {renderProducerStats(producerData, true)}
          </Card>
        ))}

        {producersData.length === 0 && (
          <Card className="p-8 text-center">
            <Icon name="Users" size={48} className="mx-auto mb-4 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">Нет данных о продакшенах</p>
          </Card>
        )}
      </div>
    );
  }

  if (!data) {
    return (
      <Card className="p-8 text-center">
        <Icon name="AlertCircle" size={48} className="mx-auto mb-4 text-muted-foreground opacity-30" />
        <p className="text-muted-foreground">Нет данных для отображения</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-serif font-bold mb-2">Мониторинг производства</h2>
          <p className="text-muted-foreground">Ваша команда за период {period.label}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={onPreviousPeriod} variant="outline" size="sm">
            <Icon name="ChevronLeft" size={16} />
          </Button>
          <Button onClick={onNextPeriod} variant="outline" size="sm">
            <Icon name="ChevronRight" size={16} />
          </Button>
        </div>
      </div>
      {renderProducerStats(data)}
    </div>
  );
};

export default ProductionMonitoring;