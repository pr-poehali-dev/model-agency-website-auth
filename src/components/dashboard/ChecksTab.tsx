import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface Employee {
  name: string;
  week: number;
  shifts?: number;
  model: string;
  sumDollars: number;
  rate: number;
  sumRubles: number;
  advance: number;
  penalty: number;
  total: number;
}

interface ProducerData {
  name: string;
  period: string;
  sumDollars: number;
  rate: number;
  sumRubles: number;
  expenses: number;
  advance: number;
  penalty: number;
  total: number;
  employees: Employee[];
}

const ChecksTab = () => {
  const [currentPeriod, setCurrentPeriod] = useState('16.10 - 02.11');
  const [exchangeRate, setExchangeRate] = useState(72.47);
  const [cbrRate, setCbrRate] = useState(79.47);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [isLoadingRate, setIsLoadingRate] = useState(false);

  useEffect(() => {
    const email = localStorage.getItem('userEmail') || '';
    setUserEmail(email);
    loadUserRole(email);
    loadExchangeRate();
  }, []);

  const loadExchangeRate = async () => {
    setIsLoadingRate(true);
    try {
      const response = await fetch('https://functions.poehali.dev/be3de232-e5c9-421e-8335-c4f67a2d744a');
      const data = await response.json();
      if (data.rate) {
        setCbrRate(data.rate);
        setExchangeRate(data.rate - 7);
      }
    } catch (err) {
      console.error('Failed to load exchange rate from CBR', err);
    } finally {
      setIsLoadingRate(false);
    }
  };

  const loadUserRole = async (email: string) => {
    try {
      const response = await fetch('https://functions.poehali.dev/67fd6902-6170-487e-bb46-f6d14ec99066');
      const users = await response.json();
      const user = users.find((u: any) => u.email === email);
      if (user) {
        setUserRole(user.role);
      }
    } catch (err) {
      console.error('Failed to load user role', err);
    }
  };

  const producerData: ProducerData = {
    name: 'Андрей',
    period: '16.10 - 02.11',
    sumDollars: 1080.85,
    rate: 72.47,
    sumRubles: 78330,
    expenses: 11000,
    advance: 60000,
    penalty: 2000,
    total: 27330,
    employees: [
      {
        name: 'Женя',
        week: 11,
        shifts: 11,
        model: 'Марго',
        sumDollars: 463.155,
        rate: 72.47,
        sumRubles: 33565,
        advance: 0,
        penalty: 1000,
        total: 32565
      },
      {
        name: 'Руслан',
        week: 12,
        shifts: 12,
        model: 'Лера',
        sumDollars: 509.205,
        rate: 72.47,
        sumRubles: 36902,
        advance: 0,
        penalty: 0,
        total: 36902
      },
      {
        name: 'Равиг',
        week: 10,
        shifts: 10,
        model: 'Лиза',
        sumDollars: 433.865,
        rate: 72.47,
        sumRubles: 31442,
        advance: 0,
        penalty: 0,
        total: 31442
      },
      {
        name: 'Андрей Пуд.',
        week: 21,
        shifts: 21,
        model: 'Лера',
        sumDollars: 738.355,
        rate: 72.47,
        sumRubles: 53509,
        advance: 0,
        penalty: 0,
        total: 53509
      },
      {
        name: 'Вероника',
        week: 11,
        model: '',
        sumDollars: 666.985,
        rate: 72.47,
        sumRubles: 48337,
        advance: 0,
        penalty: 0,
        total: 48337
      },
      {
        name: 'Марго',
        week: 12,
        model: '',
        sumDollars: 694.405,
        rate: 72.47,
        sumRubles: 45353,
        advance: 5000,
        penalty: 0,
        total: 40353
      },
      {
        name: 'Лера',
        week: 10,
        model: '',
        sumDollars: 763.885,
        rate: 72.47,
        sumRubles: 55359,
        advance: 0,
        penalty: 0,
        total: 55359
      },
      {
        name: 'Алена',
        week: 21,
        model: '',
        sumDollars: 505.175,
        rate: 72.47,
        sumRubles: 36610,
        advance: 0,
        penalty: 0,
        total: 36610
      },
      {
        name: 'Лиза',
        week: 11,
        model: '',
        sumDollars: 650.855,
        rate: 72.47,
        sumRubles: 47168,
        advance: 0,
        penalty: 0,
        total: 47168
      }
    ]
  };

  const totalModelSum = producerData.employees
    .filter(e => !e.model)
    .reduce((sum, e) => sum + e.sumRubles, 0);

  const totalOperatorSum = producerData.employees
    .filter(e => e.model)
    .reduce((sum, e) => sum + e.sumRubles, 0);

  if (userRole !== 'producer' && userRole !== 'director') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-serif font-bold text-foreground mb-2">Чеки</h2>
          <p className="text-muted-foreground">Расчет зарплат сотрудников</p>
        </div>
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-6 bg-muted rounded-full">
              <Icon name="Lock" size={48} className="text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold">Доступ ограничен</h3>
            <p className="text-muted-foreground max-w-md">
              Раздел доступен только для продюсеров и директоров
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-serif font-bold text-foreground mb-2">Чеки</h2>
          <p className="text-muted-foreground">Расчет зарплат сотрудников</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Текущий период</div>
          <Input 
            value={currentPeriod} 
            onChange={(e) => setCurrentPeriod(e.target.value)}
            className="font-semibold"
          />
        </Card>
        
        <Card className="p-4 bg-green-500/10 border-green-500/20">
          <div className="text-sm text-muted-foreground mb-1">Сумма Мод</div>
          <div className="text-2xl font-bold text-green-600">{totalModelSum.toLocaleString()}₽</div>
        </Card>

        <Card className="p-4 bg-green-500/10 border-green-500/20">
          <div className="text-sm text-muted-foreground mb-1">Сумма Опр</div>
          <div className="text-2xl font-bold text-green-600">{totalOperatorSum.toLocaleString()}₽</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card className="p-4 relative">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-muted-foreground">Курс USD</div>
            <Button 
              size="sm" 
              variant="outline"
              onClick={loadExchangeRate}
              disabled={isLoadingRate}
              className="h-7 px-2"
            >
              <Icon name={isLoadingRate ? "Loader2" : "RefreshCw"} size={14} className={isLoadingRate ? "animate-spin" : ""} />
            </Button>
          </div>
          <div className="font-bold text-4xl text-primary">
            {exchangeRate.toFixed(2)}₽
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden max-w-2xl mx-auto border-2 border-red-500/30 shadow-lg">
        <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 p-4 text-center border-b-2 border-red-500/30">
          <div className="flex items-center justify-center gap-3">
            <Icon name="Crown" size={28} className="text-red-500" />
            <h3 className="text-2xl font-serif font-bold">{producerData.name}</h3>
            <Icon name="Crown" size={28} className="text-red-500" />
          </div>
          <div className="text-sm text-muted-foreground mt-1">Период: {producerData.period}</div>
        </div>
        
        <div className="p-6 space-y-3">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground">Сумма $</span>
            <span className="font-semibold text-lg">${producerData.sumDollars.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground">Курс</span>
            <span className="font-semibold text-lg">{producerData.rate}</span>
          </div>
          
          <div className="flex justify-between items-center py-3 px-4 bg-green-500/10 rounded-lg border border-green-500/20">
            <span className="font-medium">Сумма ₽</span>
            <span className="font-bold text-xl">{producerData.sumRubles.toLocaleString()}₽</span>
          </div>
          
          <div className="flex justify-between items-center py-3 px-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
            <span className="font-medium">Затраты</span>
            <span className="font-bold text-xl text-yellow-600 dark:text-yellow-400">{producerData.expenses.toLocaleString()}₽</span>
          </div>
          
          <div className="flex justify-between items-center py-3 px-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
            <span className="font-medium">Аванс</span>
            <span className="font-bold text-xl text-yellow-600 dark:text-yellow-400">{producerData.advance.toLocaleString()}₽</span>
          </div>
          
          <div className="flex justify-between items-center py-3 px-4 bg-red-500/10 rounded-lg border border-red-500/20">
            <span className="font-medium">Штраф</span>
            <span className="font-bold text-xl text-red-600 dark:text-red-400">{producerData.penalty.toLocaleString()}₽</span>
          </div>
          
          <div className="flex justify-between items-center py-4 px-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg border-2 border-green-500/40 mt-4">
            <span className="font-bold text-lg">Итог</span>
            <span className="font-bold text-2xl text-green-600 dark:text-green-400">{producerData.total.toLocaleString()}₽</span>
          </div>
        </div>
      </Card>

      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Icon name="Users" size={24} className="text-primary" />
            <h3 className="text-2xl font-serif font-bold">Операторы</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {producerData.employees.filter(e => e.model).map((employee, index) => (
              <Card key={index} className="overflow-hidden">
                <div className="p-3 bg-blue-500/20 text-center font-bold border-b">
                  {employee.name}
                </div>
                <div className="p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Неделя</span>
                    <span className="font-medium">{employee.week}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Кол-во смен</span>
                    <span className="font-medium">{employee.shifts || employee.week}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Модель</span>
                    <span className="font-medium">{employee.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Сумма $</span>
                    <span className="font-medium">{employee.sumDollars.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Курс</span>
                    <span className="font-medium">{employee.rate}</span>
                  </div>
                  <div className="flex justify-between bg-green-500/10 p-2 rounded">
                    <span className="font-medium">Сумма ₽</span>
                    <span className="font-bold">{employee.sumRubles.toLocaleString()}₽</span>
                  </div>
                  <div className="flex justify-between bg-yellow-500/10 p-2 rounded">
                    <span className="font-medium">Аванс</span>
                    <span className="font-bold">{employee.advance}₽</span>
                  </div>
                  <div className="flex justify-between bg-red-500/10 p-2 rounded">
                    <span className="font-medium">Штраф</span>
                    <span className="font-bold">{employee.penalty}₽</span>
                  </div>
                  <div className="flex justify-between bg-green-500/20 p-2 rounded border-t-2 border-green-500">
                    <span className="font-bold">Итог</span>
                    <span className="font-bold text-lg">{employee.total.toLocaleString()}₽</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <Icon name="UserCircle" size={24} className="text-accent" />
            <h3 className="text-2xl font-serif font-bold">Контент-мейкеры</h3>
          </div>
          
          {producerData.employees.filter(e => !e.model).map((employee, index) => {
            const dates = Array.from({ length: 16 }, (_, i) => `${16 + i}.10`);
            
            return (
              <Card key={index} className="mb-6 overflow-hidden">
                <div className="p-4 bg-purple-500/20 border-b">
                  <h4 className="text-xl font-bold">{employee.name}</h4>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-2 text-left font-semibold min-w-[140px] sticky left-0 bg-muted/50">Настоящий период</th>
                        {dates.map((date) => (
                          <th key={date} className="p-2 text-center font-semibold min-w-[60px]">{date}</th>
                        ))}
                        <th className="p-2 text-center font-semibold min-w-[80px] bg-accent/10">Tokens</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b hover:bg-muted/30">
                        <td className="p-2 font-medium sticky left-0 bg-background">Online CB</td>
                        {dates.map((date) => (
                          <td key={date} className="p-2 text-center">
                            <div className="h-8 bg-muted/20 rounded"></div>
                          </td>
                        ))}
                        <td className="p-2 text-center font-bold bg-accent/5">0</td>
                      </tr>
                      
                      <tr className="border-b hover:bg-muted/30 bg-red-500/5">
                        <td className="p-2 font-medium sticky left-0 bg-red-500/5">Chaturbate</td>
                        {dates.map((date) => (
                          <td key={date} className="p-2 text-center">
                            <div className="h-8 bg-red-500/10 rounded"></div>
                          </td>
                        ))}
                        <td className="p-2 text-center font-bold bg-red-500/10">0</td>
                      </tr>
                      
                      <tr className="border-b hover:bg-muted/30">
                        <td className="p-2 font-medium sticky left-0 bg-background">Online SP</td>
                        {dates.map((date) => (
                          <td key={date} className="p-2 text-center">
                            <div className="h-8 bg-muted/20 rounded"></div>
                          </td>
                        ))}
                        <td className="p-2 text-center font-bold bg-accent/5">Tokens</td>
                      </tr>
                      
                      <tr className="border-b hover:bg-muted/30 bg-purple-500/5">
                        <td className="p-2 font-medium sticky left-0 bg-purple-500/5">Stripchat</td>
                        {dates.map((date) => (
                          <td key={date} className="p-2 text-center">
                            <div className="h-8 bg-purple-500/10 rounded"></div>
                          </td>
                        ))}
                        <td className="p-2 text-center font-bold bg-purple-500/10">0</td>
                      </tr>
                      
                      <tr className="border-b hover:bg-muted/30">
                        <td className="p-2 font-medium sticky left-0 bg-background">Online Soda</td>
                        {dates.map((date) => (
                          <td key={date} className="p-2 text-center">
                            <div className="h-8 bg-muted/20 rounded"></div>
                          </td>
                        ))}
                        <td className="p-2 text-center font-bold bg-accent/5">Tokens</td>
                      </tr>
                      
                      <tr className="border-b hover:bg-muted/30 bg-blue-500/5">
                        <td className="p-2 font-medium sticky left-0 bg-blue-500/5">CamSoda</td>
                        {dates.map((date) => (
                          <td key={date} className="p-2 text-center">
                            <div className="h-8 bg-blue-500/10 rounded"></div>
                          </td>
                        ))}
                        <td className="p-2 text-center font-bold bg-blue-500/10">0</td>
                      </tr>
                      
                      <tr className="border-b hover:bg-muted/30 bg-pink-500/5">
                        <td className="p-2 font-medium sticky left-0 bg-pink-500/5">Cam4</td>
                        {dates.map((date) => (
                          <td key={date} className="p-2 text-center">
                            <div className="h-8 bg-pink-500/10 rounded"></div>
                          </td>
                        ))}
                        <td className="p-2 text-center font-bold bg-pink-500/10">0.0</td>
                      </tr>
                      
                      <tr className="border-b hover:bg-muted/30">
                        <td className="p-2 font-medium sticky left-0 bg-background">Переводы</td>
                        {dates.map((date) => (
                          <td key={date} className="p-2 text-center">
                            <div className="h-8 bg-muted/20 rounded"></div>
                          </td>
                        ))}
                        <td className="p-2 text-center font-bold bg-accent/5">0</td>
                      </tr>
                      
                      <tr className="border-b hover:bg-muted/30">
                        <td className="p-2 font-medium sticky left-0 bg-background">Оператор (Имя)</td>
                        {dates.map((date) => (
                          <td key={date} className="p-2 text-center text-xs text-muted-foreground">Имя</td>
                        ))}
                        <td className="p-2 text-center"></td>
                      </tr>
                      
                      <tr className="border-b hover:bg-muted/30">
                        <td className="p-2 font-medium sticky left-0 bg-background">Смены</td>
                        {dates.map((date) => (
                          <td key={date} className="p-2 text-center">
                            <input type="checkbox" className="w-4 h-4" />
                          </td>
                        ))}
                        <td className="p-2 text-center font-bold bg-accent/5">0</td>
                      </tr>
                      
                      <tr className="border-b hover:bg-muted/30 bg-green-500/10">
                        <td className="p-2 font-bold sticky left-0 bg-green-500/10">Income</td>
                        {dates.map((date) => (
                          <td key={date} className="p-2 text-center font-semibold text-green-600">$0.00</td>
                        ))}
                        <td className="p-2 text-center font-bold text-lg text-green-600 bg-green-500/20">$0.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ChecksTab;