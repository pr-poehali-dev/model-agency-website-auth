import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { getCurrentPeriod, getPreviousPeriod, getNextPeriod, Period } from '@/utils/periodUtils';

const USERS_API_URL = 'https://functions.poehali.dev/67fd6902-6170-487e-bb46-f6d14ec99066';
const SALARIES_API_URL = 'https://functions.poehali.dev/c430d601-e77e-494f-bf3a-73a45e7a5a4e';
const EXCHANGE_RATE_API_URL = 'https://functions.poehali.dev/be3de232-e5c9-421e-8335-c4f67a2d744a';
const PRODUCER_API_URL = 'https://functions.poehali.dev/a480fde5-8cc8-42e8-a535-626e393f6fa6';
const ASSIGNMENTS_API_URL = 'https://functions.poehali.dev/b7d8dd69-ab09-460d-999b-c0a1002ced30';
const ADJUSTMENTS_API_URL = 'https://functions.poehali.dev/d43e7388-65e1-4856-9631-1a460d38abd7';

const roleNames: Record<string, string> = {
  'director': 'Директор',
  'producer': 'Продюсер',
  'operator': 'Оператор',
  'content_maker': 'Контент-мейкер',
  'model': 'Модель'
};

interface DashboardTabProps {
  monthlyRevenue?: any;
  onNavigate?: (tab: string) => void;
  onViewFinances?: (modelId: number, modelName: string) => void;
}

const DashboardTab = ({ onNavigate, onViewFinances }: DashboardTabProps) => {
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [userRole, setUserRole] = useState('');
  const [userFullName, setUserFullName] = useState('');
  const [currentPeriod, setCurrentPeriod] = useState<Period>(getCurrentPeriod());
  const [salaryData, setSalaryData] = useState<any>(null);
  const [exchangeRate, setExchangeRate] = useState(72.47);
  const [isLoading, setIsLoading] = useState(true);
  const [producerName, setProducerName] = useState('');
  const [adjustments, setAdjustments] = useState<{advance: number, penalty: number}>({advance: 0, penalty: 0});

  useEffect(() => {
    const email = localStorage.getItem('userEmail') || '';
    setUserEmail(email);
    if (email) {
      loadUserData(email);
      loadProducerInfo(email);
    }
  }, []);

  useEffect(() => {
    if (userEmail && userRole) {
      loadSalaryData();
      loadAdjustments();
    }
  }, [currentPeriod, userEmail, userRole]);

  useEffect(() => {
    loadExchangeRate();
  }, []);

  const loadExchangeRate = async () => {
    try {
      const response = await fetch(EXCHANGE_RATE_API_URL);
      const data = await response.json();
      if (data.rate) {
        setExchangeRate(data.rate - 7);
      }
    } catch (error) {
      console.error('Failed to load exchange rate:', error);
    }
  };

  const loadUserData = async (email: string) => {
    try {
      const response = await fetch(USERS_API_URL);
      const users = await response.json();
      const currentUser = users.find((u: any) => u.email === email);
      
      if (currentUser) {
        setUserRole(currentUser.role);
        setUserFullName(currentUser.fullName || email);
        setUserId(currentUser.id);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const loadProducerInfo = async (email: string) => {
    try {
      const usersResponse = await fetch(USERS_API_URL);
      const users = await usersResponse.json();
      const currentUser = users.find((u: any) => u.email === email);
      
      if (!currentUser) return;
      
      if (currentUser.role === 'operator') {
        const assignmentsResponse = await fetch(ASSIGNMENTS_API_URL);
        const assignments = await assignmentsResponse.json();
        const operatorAssignment = assignments.find((a: any) => a.operatorEmail === email);
        
        if (operatorAssignment) {
          const producerResponse = await fetch(`${PRODUCER_API_URL}?type=model`);
          const producerAssignments = await producerResponse.json();
          const producerAssignment = producerAssignments.find(
            (pa: any) => pa.modelEmail === operatorAssignment.modelEmail
          );
          
          if (producerAssignment) {
            const producer = users.find((u: any) => u.email === producerAssignment.producerEmail);
            if (producer) {
              setProducerName(producer.fullName || producer.email);
            }
          }
        }
      } else if (currentUser.role === 'content_maker') {
        const producerResponse = await fetch(`${PRODUCER_API_URL}?type=model`);
        const producerAssignments = await producerResponse.json();
        const producerAssignment = producerAssignments.find(
          (pa: any) => pa.modelEmail === email
        );
        
        if (producerAssignment) {
          const producer = users.find((u: any) => u.email === producerAssignment.producerEmail);
          if (producer) {
            setProducerName(producer.fullName || producer.email);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load producer info:', error);
    }
  };

  const loadSalaryData = async () => {
    setIsLoading(true);
    try {
      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const periodStart = formatDate(currentPeriod.startDate);
      const periodEnd = formatDate(currentPeriod.endDate);
      
      const response = await fetch(`${SALARIES_API_URL}?period_start=${periodStart}&period_end=${periodEnd}`);
      if (response.ok) {
        const data = await response.json();
        
        let salary = null;
        if (data.operators[userEmail]) {
          salary = { ...data.operators[userEmail], type: 'operator' };
        } else if (data.models[userEmail]) {
          salary = { ...data.models[userEmail], type: 'model' };
        } else if (data.producers[userEmail]) {
          salary = { ...data.producers[userEmail], type: 'producer' };
        }
        
        setSalaryData(salary);
      }
    } catch (error) {
      console.error('Failed to load salary data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAdjustments = async () => {
    try {
      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const periodStart = formatDate(currentPeriod.startDate);
      const periodEnd = formatDate(currentPeriod.endDate);
      
      const response = await fetch(`${ADJUSTMENTS_API_URL}?period_start=${periodStart}&period_end=${periodEnd}`);
      if (response.ok) {
        const data = await response.json();
        const userAdj = data[userEmail] || {advance: 0, penalty: 0};
        setAdjustments(userAdj);
      }
    } catch (error) {
      console.error('Failed to load adjustments:', error);
    }
  };



  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Доброе утро';
    if (hour < 18) return 'Добрый день';
    return 'Добрый вечер';
  };

  const salaryInRubles = salaryData ? Math.round((salaryData.total * exchangeRate) - adjustments.advance - adjustments.penalty) : 0;
  const salaryInDollars = salaryData ? Math.round(salaryData.total * 100) / 100 : 0;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl p-8 border border-primary/20">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary/20 rounded-full">
              <Icon name="Sparkles" size={28} className="text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{getTimeGreeting()},</p>
              <h1 className="text-3xl font-serif font-bold text-foreground">{userFullName}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
              {roleNames[userRole] || userRole}
            </Badge>
            <Badge variant="outline" className="border-muted-foreground/30">
              MBA Corporation
            </Badge>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-0"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Ваша зарплата</p>
              <p className="text-xs text-muted-foreground">{currentPeriod.label}</p>
            </div>
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Icon name="DollarSign" size={24} className="text-green-600" />
            </div>
          </div>
          
          <div className="space-y-3 mb-4">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-muted rounded w-32 mb-2"></div>
                <div className="h-6 bg-muted rounded w-24"></div>
              </div>
            ) : salaryData ? (
              <>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Начислено</p>
                  <p className="text-2xl font-bold text-foreground">{Math.round(salaryData.total * exchangeRate).toLocaleString()}₽</p>
                  <p className="text-sm text-muted-foreground">${salaryInDollars.toLocaleString()}</p>
                </div>
                
                {(adjustments.advance > 0 || adjustments.penalty > 0) && (
                  <div className="space-y-1 pt-2 border-t">
                    {adjustments.advance > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Аванс:</span>
                        <span className="text-red-600 font-medium">-{adjustments.advance.toLocaleString()}₽</span>
                      </div>
                    )}
                    {adjustments.penalty > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Штраф:</span>
                        <span className="text-red-600 font-medium">-{adjustments.penalty.toLocaleString()}₽</span>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground mb-1">К выплате</p>
                  <p className="text-3xl font-bold text-green-600">{salaryInRubles.toLocaleString()}₽</p>
                </div>
              </>
            ) : (
              <p className="text-lg text-muted-foreground">Нет данных за период</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPeriod(getPreviousPeriod(currentPeriod))}
              className="h-8"
            >
              <Icon name="ChevronLeft" size={16} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPeriod(getNextPeriod(currentPeriod))}
              className="h-8"
            >
              <Icon name="ChevronRight" size={16} />
            </Button>
          </div>
        </Card>

        {(userRole === 'director' || userRole === 'producer') ? (
          <Card className="p-6 border-2 border-accent/20 bg-gradient-to-br from-background to-accent/5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Текущий курс</p>
                <p className="text-xs text-muted-foreground">ЦБ РФ</p>
              </div>
              <div className="p-2 bg-accent/10 rounded-lg">
                <Icon name="TrendingUp" size={24} className="text-accent" />
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-3xl font-bold text-accent">{exchangeRate.toFixed(2)}₽</p>
              <p className="text-lg text-muted-foreground">за 1 доллар</p>
            </div>
          </Card>
        ) : (
          <Card className="p-6 border-2 border-purple-500/20 bg-gradient-to-br from-background to-purple-500/5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Ваш продюсер</p>
              </div>
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Icon name="UserCheck" size={24} className="text-purple-600" />
              </div>
            </div>
            
            <div className="space-y-2">
              {producerName ? (
                <>
                  <p className="text-2xl font-bold text-purple-600">{producerName}</p>
                  <p className="text-sm text-muted-foreground">По любым вопросам обращайтесь к вашему продюсеру</p>
                </>
              ) : (
                <p className="text-lg text-muted-foreground">Продюсер не назначен</p>
              )}
            </div>
          </Card>
        )}
      </div>

      {userRole === 'content_maker' && salaryData && salaryData.details && salaryData.details.length > 0 && (() => {
        const details = salaryData.details;
        const totalIncome = salaryData.total;
        const shiftsCount = details.filter((d: any) => d.amount > 0).length;
        const avgIncome = shiftsCount > 0 ? totalIncome / shiftsCount : 0;
        const bestDay = Math.max(...details.map((d: any) => d.amount || 0));
        const bestDayData = details.find((d: any) => d.amount === bestDay);

        return (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Icon name="BarChart3" size={20} className="text-primary" />
              Статистика за период {currentPeriod.label}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
                <p className="text-sm text-muted-foreground mb-1">Всего за период</p>
                <p className="text-2xl font-bold text-green-600">${totalIncome.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-500/20">
                <p className="text-sm text-muted-foreground mb-1">Средний доход</p>
                <p className="text-2xl font-bold text-blue-600">${avgIncome.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">за смену</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
                <p className="text-sm text-muted-foreground mb-1">Лучший день</p>
                <p className="text-2xl font-bold text-purple-600">${bestDay.toFixed(2)}</p>
                {bestDayData && (
                  <p className="text-xs text-muted-foreground">{new Date(bestDayData.date).toLocaleDateString('ru-RU', {day: '2-digit', month: '2-digit'})}</p>
                )}
              </div>
              <div className="p-4 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-lg border border-orange-500/20">
                <p className="text-sm text-muted-foreground mb-1">Смен</p>
                <p className="text-2xl font-bold text-orange-600">{shiftsCount}</p>
              </div>
            </div>
          </Card>
        );
      })()}

      {salaryData && salaryData.details && salaryData.details.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Icon name="FileText" size={20} className="text-primary" />
            Детализация за период
          </h3>
          <div className="space-y-3">
            {salaryData.details.slice(0, 5).map((detail: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon name="Calendar" size={16} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{new Date(detail.date).toLocaleDateString('ru-RU')}</p>
                    {detail.model_email && (
                      <p className="text-sm text-muted-foreground">{detail.model_email}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">
                    {Math.round(detail.amount * exchangeRate).toLocaleString()}₽
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ${Math.round(detail.amount * 100) / 100}
                  </p>
                </div>
              </div>
            ))}
            {salaryData.details.length > 5 && (
              <p className="text-sm text-muted-foreground text-center pt-2">
                и ещё {salaryData.details.length - 5} записей...
              </p>
            )}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {userRole === 'content_maker' && userId && (
          <Card 
            className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-green-500 hover:scale-105 transition-transform"
            onClick={() => onViewFinances?.(userId, userFullName)}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Icon name="DollarSign" size={20} className="text-green-600" />
              </div>
              <h4 className="font-semibold">Мои финансы</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Просматривайте статистику своих доходов по платформам
            </p>
          </Card>
        )}
        
        <Card 
          className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-blue-500 hover:scale-105 transition-transform"
          onClick={() => onNavigate?.('files')}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Icon name="Files" size={20} className="text-blue-600" />
            </div>
            <h4 className="font-semibold">Файлы</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            Удобно загружайте фотографии и видео моделей для работы
          </p>
        </Card>

        <Card 
          className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-purple-500 hover:scale-105 transition-transform"
          onClick={() => onNavigate?.('schedule')}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Icon name="Calendar" size={20} className="text-purple-600" />
            </div>
            <h4 className="font-semibold">Расписание</h4>
          </div>
          <p className="text-sm text-muted-foreground">
            Отслеживайте свои смены и планируйте рабочее время
          </p>
        </Card>
      </div>
    </div>
  );
};

export default DashboardTab;