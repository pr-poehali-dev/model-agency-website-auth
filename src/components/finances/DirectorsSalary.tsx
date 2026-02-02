import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { Period } from '@/utils/periodUtils';
import { authenticatedFetch } from '@/lib/api';

interface ModelStats {
  name: string;
  email: string;
  current_income: number;
  current_gross_revenue: number;
  current_cb_gross_revenue?: number;
  current_sp_gross_revenue?: number;
  current_soda_gross_revenue?: number;
  is_solo_maker: boolean;
  solo_percentage: number;
}

interface ProducerData {
  models: ModelStats[];
}

interface Director {
  name: string;
  salary: number;
}

interface SalaryData {
  operators: Record<string, { email: string; total: number }>;
  models: Record<string, { email: string; total: number }>;
  producers: Record<string, { email: string; total: number }>;
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
  const [issuedFunds, setIssuedFunds] = useState<number>(0);
  const [salariesData, setSalariesData] = useState<SalaryData | null>(null);

  const saveFinances = async (expenses: number, funds: number) => {
    if (!period?.startDate || !period?.endDate) return;
    
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const periodStart = formatDate(period.startDate);
    const periodEnd = formatDate(period.endDate);
    
    try {
      await authenticatedFetch('https://functions.poehali.dev/32834f55-221d-44d6-b7a6-544c4ac155ec', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          period_start: periodStart,
          period_end: periodEnd,
          expenses: expenses,
          issued_funds: funds
        })
      });
    } catch (error) {
      console.error('Error saving finances:', error);
    }
  };

  useEffect(() => {
    const fetchDirectorStats = async () => {
      if (!period?.startDate || !period?.endDate) return;
      
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
        const [statsResponse, financesResponse, salariesResponse] = await Promise.all([
          authenticatedFetch(
            `https://functions.poehali.dev/d82439a1-a9ac-4798-a02a-8874ce48e24b?role=director&email=${encodeURIComponent(userEmail)}&period_start=${periodStart}&period_end=${periodEnd}`
          ),
          authenticatedFetch(
            `https://functions.poehali.dev/32834f55-221d-44d6-b7a6-544c4ac155ec?period_start=${periodStart}&period_end=${periodEnd}`
          ),
          authenticatedFetch(
            `https://functions.poehali.dev/c430d601-e77e-494f-bf3a-73a45e7a5a4e?period_start=${periodStart}&period_end=${periodEnd}`
          )
        ]);
        
        const statsData = await statsResponse.json();
        const financesData = await financesResponse.json();
        const salariesDataResult = await salariesResponse.json();
        
        if (statsData.producers) {
          setProducersData(statsData.producers);
        }
        
        if (financesData) {
          setTotalExpenses(financesData.expenses || 0);
          setIssuedFunds(financesData.issued_funds || 0);
        }
        
        if (salariesDataResult) {
          setSalariesData(salariesDataResult);
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

  // Рассчитываем зарплату директоров и статистику по площадкам
  let totalGrossRevenueUSD = 0; // Сумма всех токенов × 0.05
  let totalDirectorsIncomeUSD = 0; // Доля директоров
  let totalChaturbateUSD = 0; // Общая выручка с Chaturbate
  let totalStripchatUSD = 0; // Общая выручка со Stripchat
  let totalCamSodaUSD = 0; // Общая выручка с CamSoda

  producersData.forEach(producer => {
    producer.models.forEach(model => {
      // current_gross_revenue уже содержит (токены × 0.05)
      const grossRevenue = model.current_gross_revenue || 0;
      const cbRevenue = model.current_cb_gross_revenue || 0;
      const spRevenue = model.current_sp_gross_revenue || 0;
      const sodaRevenue = model.current_soda_gross_revenue || 0;
      
      totalGrossRevenueUSD += grossRevenue;
      totalChaturbateUSD += cbRevenue;
      totalStripchatUSD += spRevenue;
      totalCamSodaUSD += sodaRevenue;
      
      // Если соло-мейкер, директора получают остаток (100% - solo_percentage)
      // Если обычная модель, директора получают 40%
      if (model.is_solo_maker) {
        const directorsShare = (100 - model.solo_percentage) / 100;
        totalDirectorsIncomeUSD += grossRevenue * directorsShare;
      } else {
        totalDirectorsIncomeUSD += grossRevenue * 0.4;
      }
    });
  });

  // Конвертируем в рубли
  const totalGrossRevenue = totalGrossRevenueUSD * USD_TO_RUB;
  const totalDirectorsIncome = totalDirectorsIncomeUSD * USD_TO_RUB;
  
  // Каждый директор получает 50% от общей доли директоров минус половина затрат плюс половина выданных средств
  const expensesPerDirector = totalExpenses / 2;
  const issuedFundsPerDirector = issuedFunds / 2;
  const directorSalary = Math.max(0, totalDirectorsIncome * 0.5 - expensesPerDirector + issuedFundsPerDirector);

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

      <div className="grid gap-4 md:grid-cols-2 mb-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Icon name="DollarSign" size={24} className="text-blue-500" />
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-1">Chaturbate</h4>
                <p className="text-sm text-muted-foreground">Общая выручка (токены × 0.05)</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-500">
                ${totalChaturbateUSD.toLocaleString('ru-RU', { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Icon name="DollarSign" size={24} className="text-purple-500" />
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-1">Stripchat</h4>
                <p className="text-sm text-muted-foreground">Общая выручка (токены × 0.05)</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-purple-500">
                ${totalStripchatUSD.toLocaleString('ru-RU', { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-1 mb-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Icon name="DollarSign" size={24} className="text-green-500" />
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-1">CamSoda</h4>
                <p className="text-sm text-muted-foreground">Общая выручка (токены × 0.05)</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-500">
                ${totalCamSodaUSD.toLocaleString('ru-RU', { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </Card>
      </div>

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
              onChange={(e) => {
                const newValue = Math.max(0, parseFloat(e.target.value) || 0);
                setTotalExpenses(newValue);
                saveFinances(newValue, issuedFunds);
              }}
              className="w-48 text-right font-semibold"
              placeholder="0"
            />
            <span className="text-muted-foreground font-medium">₽</span>
          </div>
        </div>
      </Card>

      <Card className="p-6 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Icon name="TrendingUp" size={24} className="text-green-500" />
            </div>
            <div>
              <h4 className="font-semibold text-lg mb-1">Выданные средства</h4>
              <p className="text-sm text-muted-foreground">Прибавляется к зарплатам директоров поровну</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={issuedFunds}
              onChange={(e) => {
                const newValue = Math.max(0, parseFloat(e.target.value) || 0);
                setIssuedFunds(newValue);
                saveFinances(totalExpenses, newValue);
              }}
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
              {totalExpenses > 0 && (
                <div className="flex items-center justify-between text-sm text-destructive">
                  <span>Затраты (50%):</span>
                  <span>- {expensesPerDirector.toLocaleString('ru-RU')} ₽</span>
                </div>
              )}
              {issuedFunds > 0 && (
                <div className="flex items-center justify-between text-sm text-green-600">
                  <span>Выданные средства (50%):</span>
                  <span>+ {issuedFundsPerDirector.toLocaleString('ru-RU')} ₽</span>
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

      {salariesData && (
        <Card className="p-6 mt-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Icon name="Calculator" size={20} />
            Проверка расчёта зарплат директоров
          </h3>
          
          {(() => {
            const totalOperatorsSalary = Object.values(salariesData.operators).reduce((sum, op) => sum + op.total, 0);
            const totalModelsSalary = Object.values(salariesData.models).reduce((sum, model) => sum + model.total, 0);
            const totalProducersSalary = Object.values(salariesData.producers).reduce((sum, prod) => sum + prod.total, 0);
            
            const totalEmployeesSalary = totalOperatorsSalary + totalModelsSalary + totalProducersSalary;
            
            const totalCheckRUB = totalGrossRevenue;
            const remainderRUB = totalCheckRUB - (totalEmployeesSalary * USD_TO_RUB);
            const directorSalaryCheck = remainderRUB / 2;
            
            return (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Общий чек (токены × 0.05 × курс):</span>
                  <span className="font-medium">{totalCheckRUB.toLocaleString('ru-RU')} ₽</span>
                </div>
                
                <div className="space-y-2 pl-4 border-l-2 border-muted">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Зарплата операторов:</span>
                    <span className="font-medium text-orange-600">- {(totalOperatorsSalary * USD_TO_RUB).toLocaleString('ru-RU')} ₽</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Зарплата моделей:</span>
                    <span className="font-medium text-pink-600">- {(totalModelsSalary * USD_TO_RUB).toLocaleString('ru-RU')} ₽</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Зарплата продюсеров:</span>
                    <span className="font-medium text-purple-600">- {(totalProducersSalary * USD_TO_RUB).toLocaleString('ru-RU')} ₽</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm pt-2 border-t">
                  <span className="text-muted-foreground font-medium">Остаток:</span>
                  <span className="font-semibold">{remainderRUB.toLocaleString('ru-RU')} ₽</span>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t-2 border-primary/20">
                  <span className="font-medium">Зарплата каждого директора (50% остатка):</span>
                  <span className="text-xl font-bold text-primary">{directorSalaryCheck.toLocaleString('ru-RU')} ₽</span>
                </div>
                
                {Math.abs(directorSalaryCheck - directorSalary) > 1 && (
                  <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Icon name="AlertTriangle" size={16} className="text-yellow-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                          Расхождение в расчётах
                        </p>
                        <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                          Разница: {Math.abs(directorSalaryCheck - directorSalary).toLocaleString('ru-RU')} ₽
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </Card>
      )}
    </div>
  );
};

export default DirectorsSalary;