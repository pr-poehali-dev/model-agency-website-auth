import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { getCurrentPeriod } from '@/utils/periodUtils';
import { authenticatedFetch } from '@/lib/api';

interface Model {
  id: number;
  name: string;
  email?: string;
  image: string;
  height: string;
  bust: string;
  waist: string;
  hips: string;
  experience: string;
  specialty: string;
  status: string;
}

interface DashboardHomeProps {
  models: Model[];
  userRole?: string | null;
  userEmail?: string;
  onNavigate?: (tab: string) => void;
}

const DashboardHome = ({ models, userRole, userEmail, onNavigate }: DashboardHomeProps) => {
  const [cbrRate, setCbrRate] = useState<number | null>(null);
  const [workingRate, setWorkingRate] = useState<number | null>(null);
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [mySalary, setMySalary] = useState<number | null>(null);
  const [myAdvance, setMyAdvance] = useState<number>(0);
  const [myPenalty, setMyPenalty] = useState<number>(0);
  const [myExpenses, setMyExpenses] = useState<number>(0);
  const [isLoadingSalary, setIsLoadingSalary] = useState(false);
  const [myProducer, setMyProducer] = useState<string>('MBA Production');
  const [currentPeriodLabel, setCurrentPeriodLabel] = useState<string>('');

  useEffect(() => {
    if (userRole === 'director') {
      loadExchangeRate();
      loadAssignments();
      loadUsers();
    } else if (userRole && ['operator', 'content_maker', 'solo_maker'].includes(userRole) && userEmail) {
      loadMySalary();
      loadMyProducer();
      
      const interval = setInterval(() => {
        loadMySalary();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [userRole, userEmail]);

  const loadAssignments = async () => {
    try {
      const response = await authenticatedFetch('https://functions.poehali.dev/b7d8dd69-ab09-460d-999b-c0a1002ced30');
      
      if (!response.ok) {
        console.error('Failed to load assignments: HTTP', response.status);
        setAssignments([]);
        return;
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        console.error('Invalid assignments response:', data);
        setAssignments([]);
        return;
      }
      
      setAssignments(data);
    } catch (err) {
      console.error('Failed to load assignments', err);
      setAssignments([]);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await authenticatedFetch('https://functions.poehali.dev/67fd6902-6170-487e-bb46-f6d14ec99066', {
        method: 'GET',
        headers: {
          'X-Auth-Token': localStorage.getItem('authToken') || ''
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        setUsers([]);
        return;
      }
      
      const data = await response.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load users', err);
      setUsers([]);
    }
  };

  const loadExchangeRate = async () => {
    setIsLoadingRate(true);
    try {
      const response = await authenticatedFetch('https://functions.poehali.dev/be3de232-e5c9-421e-8335-c4f67a2d744a');
      
      if (!response.ok) {
        console.error('Failed to load exchange rate: HTTP', response.status);
        setIsLoadingRate(false);
        return;
      }
      
      const data = await response.json();
      if (data.rate) {
        const cbr = data.rate;
        const working = cbr - 5;
        setCbrRate(cbr);
        setWorkingRate(working);
      }
    } catch (err) {
      console.error('Failed to load exchange rate from CBR', err);
    } finally {
      setIsLoadingRate(false);
    }
  };

  const loadMySalary = async () => {
    if (!userEmail) return;
    
    setIsLoadingSalary(true);
    try {
      const currentPeriod = getCurrentPeriod();
      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const periodStart = formatDate(currentPeriod.startDate);
      const periodEnd = formatDate(currentPeriod.endDate);
      setCurrentPeriodLabel(currentPeriod.label);

      const [salaryRes, adjustmentsRes, rateRes] = await Promise.all([
        authenticatedFetch(`https://functions.poehali.dev/c430d601-e77e-494f-bf3a-73a45e7a5a4e?period_start=${periodStart}&period_end=${periodEnd}`),
        authenticatedFetch(`https://functions.poehali.dev/d43e7388-65e1-4856-9631-1a460d38abd7?period_start=${periodStart}&period_end=${periodEnd}`),
        authenticatedFetch('https://functions.poehali.dev/be3de232-e5c9-421e-8335-c4f67a2d744a')
      ]);

      const salaryData = await salaryRes.json();
      const adjustmentsData = await adjustmentsRes.json();
      const rateData = await rateRes.json();

      const exchangeRate = rateData.rate ? rateData.rate - 5 : 95;

      let baseSalaryUSD = 0;
      if (userRole === 'operator' && salaryData.operators?.[userEmail]) {
        baseSalaryUSD = salaryData.operators[userEmail].total || 0;
      } else if ((userRole === 'content_maker' || userRole === 'solo_maker') && salaryData.models?.[userEmail]) {
        baseSalaryUSD = salaryData.models[userEmail].total || 0;
      }

      const adjustments = adjustmentsData[userEmail] || { advance: 0, penalty: 0, expenses: 0 };

      const baseRUB = baseSalaryUSD * exchangeRate;
      const totalWithExpenses = baseRUB + (adjustments.expenses || 0);
      const totalRUB = totalWithExpenses - (adjustments.advance || 0) - (adjustments.penalty || 0);

      setMySalary(totalRUB);
      setMyAdvance(adjustments.advance || 0);
      setMyPenalty(adjustments.penalty || 0);
      setMyExpenses(adjustments.expenses || 0);
    } catch (err) {
      console.error('Failed to load salary', err);
      setMySalary(0);
    } finally {
      setIsLoadingSalary(false);
    }
  };

  const loadMyProducer = async () => {
    if (!userEmail || !userRole) return;
    
    try {
      let assignment = null;
      
      if (userRole === 'operator') {
        const producerRes = await authenticatedFetch('https://functions.poehali.dev/a480fde5-8cc8-42e8-a535-626e393f6fa6?type=operator');
        const producerData = await producerRes.json();
        assignment = producerData.find((a: any) => a.operatorEmail === userEmail);
      } else if (userRole === 'content_maker' || userRole === 'solo_maker') {
        const producerRes = await authenticatedFetch('https://functions.poehali.dev/a480fde5-8cc8-42e8-a535-626e393f6fa6?type=model');
        const producerData = await producerRes.json();
        assignment = producerData.find((a: any) => a.modelEmail === userEmail);
      }
      
      if (assignment) {
        console.log('[DashboardHome] Assignment found:', assignment);
        const usersRes = await authenticatedFetch('https://functions.poehali.dev/67fd6902-6170-487e-bb46-f6d14ec99066', {
          method: 'GET',
          headers: {
            'X-Auth-Token': localStorage.getItem('authToken') || ''
          },
          credentials: 'include'
        });
        
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          console.log('[DashboardHome] Users data loaded:', usersData);
          if (Array.isArray(usersData)) {
            const producer = usersData.find((u: any) => u.email === assignment.producerEmail);
            console.log('[DashboardHome] Producer found:', producer);
            console.log('[DashboardHome] Looking for email:', assignment.producerEmail);
            setMyProducer(producer?.fullName || assignment.producerEmail);
          } else {
            setMyProducer('MBA Production');
          }
        } else {
          setMyProducer('MBA Production');
        }
      } else {
        setMyProducer('MBA Production');
      }
    } catch (err) {
      console.error('Failed to load producer', err);
      setMyProducer('MBA Production');
    }
  };

  const totalModels = users.filter(u => u.role === 'content_maker' || u.role === 'solo_maker').length;
  
  const modelsWithOperators = new Set(assignments.map(a => a.modelEmail));
  const soloMakers = users.filter(u => u.role === 'solo_maker').map(u => u.email);
  const activeModelsEmails = new Set([...modelsWithOperators, ...soloMakers]);
  const activeModelsCount = activeModelsEmails.size;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-serif font-bold text-foreground mb-2">Главная</h2>
        <p className="text-muted-foreground"></p>
      </div>

      {userRole && ['operator', 'content_maker', 'solo_maker'].includes(userRole) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
            <div className="flex items-center justify-between mb-4">
              <Icon name="Wallet" size={24} className="text-green-600" />
              <Button
                variant="ghost"
                size="sm"
                onClick={loadMySalary}
                disabled={isLoadingSalary}
                className="h-8 w-8 p-0"
              >
                <Icon name="RefreshCw" size={16} className={isLoadingSalary ? 'animate-spin' : ''} />
              </Button>
            </div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Моя зарплата{currentPeriodLabel ? ` (${currentPeriodLabel})` : ''}</h3>
            <p className="text-3xl font-serif font-bold text-foreground mb-3 break-words">
              {isLoadingSalary ? '...' : mySalary !== null ? `${Math.round(mySalary).toLocaleString('ru-RU')} ₽` : '—'}
            </p>
            {!isLoadingSalary && mySalary !== null && (
              <div className="space-y-1 text-sm">
                {myAdvance > 0 && (
                  <div className="flex justify-between text-red-600 dark:text-red-400">
                    <span>Аванс:</span>
                    <span>-{myAdvance.toLocaleString('ru-RU')} ₽</span>
                  </div>
                )}
                {myPenalty > 0 && (
                  <div className="flex justify-between text-red-600 dark:text-red-400">
                    <span>Штраф:</span>
                    <span>-{myPenalty.toLocaleString('ru-RU')} ₽</span>
                  </div>
                )}
                {myExpenses > 0 && (
                  <div className="flex justify-between text-blue-600 dark:text-blue-400">
                    <span>Расходы:</span>
                    <span>+{myExpenses.toLocaleString('ru-RU')} ₽</span>
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card 
            className="p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20 cursor-pointer hover:shadow-lg transition-all group"
            onClick={() => onNavigate?.('schedule')}
          >
            <div className="flex items-center mb-4">
              <Icon name="Calendar" size={24} className="text-blue-600" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Расписание</h3>
            <p className="text-3xl font-serif font-bold text-foreground mb-2">Смены</p>
            <p className="text-sm text-muted-foreground">Мое рабочее время</p>
          </Card>
        </div>
      )}

      {userRole && ['operator', 'content_maker', 'solo_maker'].includes(userRole) && (
        <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <div className="flex items-center mb-4">
            <Icon name="User" size={24} className="text-purple-600" />
          </div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Мой продюсер</h3>
          <p className="text-2xl font-serif font-bold text-foreground break-words">{myProducer}</p>
        </Card>
      )}

      {userRole === 'producer' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card 
            className="p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20 cursor-pointer hover:shadow-lg transition-all group"
            onClick={() => onNavigate?.('checks')}
          >
            <div className="flex items-center mb-4">
              <Icon name="Receipt" size={24} className="text-blue-600" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Чеки</h3>
            <p className="text-3xl font-serif font-bold text-foreground mb-2">Проверка</p>
            <p className="text-sm text-muted-foreground">Контроль выручки моделей</p>
          </Card>

          <Card 
            className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20 cursor-pointer hover:shadow-lg transition-all group"
            onClick={() => onNavigate?.('models')}
          >
            <div className="flex items-center mb-4">
              <Icon name="Users" size={24} className="text-purple-600" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Мои модели</h3>
            <p className="text-3xl font-serif font-bold text-foreground mb-2">Команда</p>
            <p className="text-sm text-muted-foreground">Список моих моделей</p>
          </Card>
        </div>
      )}

      {userRole === 'director' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-gradient-to-br from-accent/10 to-primary/10 border-accent/20">
          <div className="flex items-center mb-4">
            <Icon name="Users" size={24} className="text-accent" />
          </div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Всего моделей</h3>
          <p className="text-3xl font-serif font-bold text-foreground">{totalModels}</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-primary/20 rounded-lg">
              <Icon name="CheckCircle" size={24} className="text-primary" />
            </div>
            <Badge variant="secondary" className="bg-primary/20 text-primary">С операторами</Badge>
          </div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Активные модели</h3>
          <p className="text-3xl font-serif font-bold text-foreground">{activeModelsCount}</p>
        </Card>
      </div>
      )}

      {userRole === 'director' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border-amber-500/20">
              <div className="flex items-center mb-4">
                <Icon name="TrendingUp" size={24} className="text-amber-600" />
              </div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Курс доллара (ЦБ - 5₽)</h3>
              <p className="text-3xl font-serif font-bold text-foreground">
                {isLoadingRate ? '...' : workingRate ? `${workingRate.toFixed(2)} ₽` : '—'}
              </p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-500/20 rounded-lg">
                  <Icon name="DollarSign" size={24} className="text-orange-600" />
                </div>
                <Badge variant="secondary" className="bg-orange-500/20 text-orange-600">ЦБ РФ</Badge>
              </div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Курс доллара ЦБ</h3>
              <p className="text-3xl font-serif font-bold text-foreground">
                {isLoadingRate ? '...' : cbrRate ? `${cbrRate.toFixed(2)} ₽` : '—'}
              </p>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card 
              className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20 cursor-pointer hover:shadow-lg transition-all group"
              onClick={() => onNavigate?.('finances')}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors">
                  <Icon name="Wallet" size={24} className="text-green-600" />
                </div>
                <Badge variant="secondary" className="bg-green-500/20 text-green-600">Перейти</Badge>
              </div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Финансы</h3>
              <p className="text-3xl font-serif font-bold text-foreground mb-2">Управление</p>
              <p className="text-sm text-muted-foreground">Транзакции и статистика</p>
            </Card>

            <Card 
              className="p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20 cursor-pointer hover:shadow-lg transition-all group"
              onClick={() => onNavigate?.('schedule')}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                  <Icon name="Calendar" size={24} className="text-blue-600" />
                </div>
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-600">Перейти</Badge>
              </div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Расписание</h3>
              <p className="text-3xl font-serif font-bold text-foreground mb-2">Смены</p>
              <p className="text-sm text-muted-foreground">Управление рабочим временем</p>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardHome;