import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface Employee {
  name: string;
  week: number;
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
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const email = localStorage.getItem('userEmail') || '';
    setUserEmail(email);
    loadUserRole(email);
  }, []);

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
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Курс</div>
          <Input 
            type="number" 
            value={exchangeRate} 
            onChange={(e) => setExchangeRate(parseFloat(e.target.value))}
            className="font-semibold text-lg"
          />
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
                    <span className="font-medium">{employee.week}</span>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {producerData.employees.filter(e => !e.model).map((employee, index) => (
              <Card key={index} className="overflow-hidden">
                <div className="p-3 bg-purple-500/20 text-center font-bold border-b">
                  {employee.name}
                </div>
                <div className="p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Неделя</span>
                    <span className="font-medium">{employee.week}</span>
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
      </div>
    </div>
  );
};

export default ChecksTab;