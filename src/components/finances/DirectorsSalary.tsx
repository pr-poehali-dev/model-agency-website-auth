import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { Period } from '@/utils/periodUtils';

interface ModelStats {
  name: string;
  email: string;
  current_income: number;
  current_gross_revenue: number;
  is_solo_maker: boolean;
  solo_percentage: number;
}

interface Adjustment {
  email: string;
  role: string;
  advance: number;
  penalty: number;
  expenses: number;
}

interface ProducerData {
  models: ModelStats[];
  operators?: any[];
  adjustments?: {
    current: Adjustment[];
    previous: Adjustment[];
  };
}

interface Director {
  name: string;
  salary: number;
}

interface DirectorsSalaryProps {
  userEmail: string;
  period: Period;
  onPreviousPeriod: () => void;
  onNextPeriod: () => void;
}

const DirectorsSalary = ({ userEmail, period, onPreviousPeriod, onNextPeriod }: DirectorsSalaryProps) => {
  const [producersData, setProducersData] = useState<ProducerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);

  useEffect(() => {
    const fetchDirectorStats = async () => {
      if (!period?.startDate || !period?.endDate) return;
      
      // Форматируем даты в YYYY-MM-DD
      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const periodStart = formatDate(period.startDate);
      const periodEnd = formatDate(period.endDate);
      
      setLoading(true);
      try {
        const response = await fetch(
          `https://functions.poehali.dev/d82439a1-a9ac-4798-a02a-8874ce48e24b?user_email=${encodeURIComponent(userEmail)}&role=director&period_start=${periodStart}&period_end=${periodEnd}`
        );
        const data = await response.json();
        console.log('DirectorsSalary data received:', data);
        if (data.producers) {
          console.log('Producers data:', data.producers);
          setProducersData(data.producers);
        }
      } catch (error) {
        console.error('Error fetching director stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDirectorStats();
  }, [userEmail, period]);

  // Получаем курс доллара из настроек
  const usdRateStr = localStorage.getItem('usd_to_rub_rate') || '95';
  const USD_TO_RUB = parseFloat(usdRateStr);

  // Рассчитываем зарплату директоров
  let totalGrossRevenueUSD = 0; // Сумма всех токенов × 0.05
  let totalDirectorsIncomeUSD = 0; // Доля директоров
  let totalAdvances = 0; // Общие авансы всех сотрудников
  let totalPenalties = 0; // Общие штрафы всех сотрудников

  console.log('Processing producers, count:', producersData.length);
  
  producersData.forEach((producer, idx) => {
    console.log(`Producer ${idx}:`, producer.producer_name || 'Unknown', 'has adjustments:', !!producer.adjustments);
    
    producer.models.forEach(model => {
      // current_gross_revenue уже содержит (токены × 0.05)
      const grossRevenue = model.current_gross_revenue || 0;
      totalGrossRevenueUSD += grossRevenue;
      
      // Если соло-мейкер, директора получают остаток (100% - solo_percentage)
      // Если обычная модель, директора получают 40%
      if (model.is_solo_maker) {
        const directorsShare = (100 - model.solo_percentage) / 100;
        totalDirectorsIncomeUSD += grossRevenue * directorsShare;
      } else {
        totalDirectorsIncomeUSD += grossRevenue * 0.4;
      }
    });
    
    // Собираем авансы и штрафы всех сотрудников
    if (producer.adjustments?.current) {
      console.log(`  Adjustments count for ${producer.producer_name}:`, producer.adjustments.current.length);
      producer.adjustments.current.forEach(adj => {
        const advance = parseFloat(adj.advance) || 0;
        const penalty = parseFloat(adj.penalty) || 0;
        console.log('  Adjustment:', adj.email, 'advance:', advance, 'penalty:', penalty);
        totalAdvances += advance;
        totalPenalties += penalty;
      });
    } else {
      console.log(`  No adjustments for ${producer.producer_name}`);
    }
  });
  
  console.log('FINAL - Total advances:', totalAdvances, 'Total penalties:', totalPenalties);

  // Конвертируем в рубли
  const totalGrossRevenue = totalGrossRevenueUSD * USD_TO_RUB;
  const totalDirectorsIncome = totalDirectorsIncomeUSD * USD_TO_RUB;
  
  // Каждый директор получает 50% от общей доли директоров + половина штрафов + половина авансов - половина затрат
  const advancesPerDirector = totalAdvances / 2;
  const penaltiesPerDirector = totalPenalties / 2;
  const expensesPerDirector = totalExpenses / 2;
  const directorSalary = Math.max(0, totalDirectorsIncome * 0.5 + penaltiesPerDirector + advancesPerDirector - expensesPerDirector);

  const displayDirectors: Director[] = [
    { name: 'Директор Юрий', salary: directorSalary },
    { name: 'Директор Александр', salary: directorSalary }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold mb-1">Зарплата директоров</h3>
          <p className="text-sm text-muted-foreground">
            Период: {period?.label || 'Загрузка...'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onPreviousPeriod}
          >
            <Icon name="ChevronLeft" size={16} />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onNextPeriod}
          >
            <Icon name="ChevronRight" size={16} />
          </Button>
        </div>
      </div>

      <Card className="p-6 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Icon name="TrendingUp" size={24} className="text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-1">Общие штрафы</h4>
              <p className="text-sm text-muted-foreground">Прибавляется к зарплатам директоров поровну</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-green-600">{totalPenalties.toLocaleString('ru-RU')}</span>
            <span className="text-muted-foreground font-medium">₽</span>
          </div>
        </div>
      </Card>

      <Card className="p-6 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Icon name="Wallet" size={24} className="text-orange-600" />
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-1">Общие авансы</h4>
              <p className="text-sm text-muted-foreground">Прибавляется к зарплатам директоров поровну</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-orange-600">{totalAdvances.toLocaleString('ru-RU')}</span>
            <span className="text-muted-foreground font-medium">₽</span>
          </div>
        </div>
      </Card>

      <Card className="p-6 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <Icon name="TrendingDown" size={24} className="text-destructive" />
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-1">Общие затраты</h4>
              <p className="text-sm text-muted-foreground">Вычитается из зарплат директоров поровну</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={totalExpenses}
              onChange={(e) => setTotalExpenses(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-48 text-right font-semibold"
              placeholder="0"
            />
            <span className="text-muted-foreground font-medium">₽</span>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {displayDirectors.map((director, index) => (
          <Card key={index} className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon name="UserCog" size={24} className="text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-1">{director.name}</h4>
                  <p className="text-2xl font-bold text-primary">
                    {director.salary.toLocaleString('ru-RU')} ₽
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Общий чек (токены × 0.05):</span>
                <span className="font-medium">{totalGrossRevenue.toLocaleString('ru-RU')} ₽</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Доля директоров:</span>
                <span className="font-medium">{totalDirectorsIncome.toLocaleString('ru-RU')} ₽</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">50% доли:</span>
                <span className="font-medium">{(totalDirectorsIncome * 0.5).toLocaleString('ru-RU')} ₽</span>
              </div>
              {totalPenalties > 0 && (
                <div className="flex items-center justify-between text-sm text-green-600">
                  <span>Штрафы (50%):</span>
                  <span>+ {penaltiesPerDirector.toLocaleString('ru-RU')} ₽</span>
                </div>
              )}
              {totalAdvances > 0 && (
                <div className="flex items-center justify-between text-sm text-orange-600">
                  <span>Авансы (50%):</span>
                  <span>+ {advancesPerDirector.toLocaleString('ru-RU')} ₽</span>
                </div>
              )}
              {totalExpenses > 0 && (
                <div className="flex items-center justify-between text-sm text-destructive">
                  <span>Затраты (50%):</span>
                  <span>- {expensesPerDirector.toLocaleString('ru-RU')} ₽</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm pt-2 border-t">
                <span className="text-muted-foreground font-medium">Итого к выплате:</span>
                <span className="font-bold text-primary">{director.salary.toLocaleString('ru-RU')} ₽</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DirectorsSalary;