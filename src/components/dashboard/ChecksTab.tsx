import { useState, useEffect, memo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import ExchangeRateCard from './checks/ExchangeRateCard';
import ProducerSalaryCard from './checks/ProducerSalaryCard';
import ProducersSection from './checks/ProducersSection';
import OperatorsSection from './checks/OperatorsSection';
import ContentMakersSection from './checks/ContentMakersSection';
import SoloMakersSection from './checks/SoloMakersSection';
import { producerData } from './checks/mockData';
import { getCurrentPeriod, getPreviousPeriod, getNextPeriod, Period } from '@/utils/periodUtils';

const ChecksTab = () => {
  const [currentPeriod, setCurrentPeriod] = useState<Period>(getCurrentPeriod());
  const [exchangeRate, setExchangeRate] = useState(72.47);
  const [cbrRate, setCbrRate] = useState(79.47);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [isLoadingRole, setIsLoadingRole] = useState(true);
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  const [producerAssignments, setProducerAssignments] = useState<any[]>([]);
  const [producerModels, setProducerModels] = useState<any[]>([]);
  const [allAssignments, setAllAssignments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [salaries, setSalaries] = useState<any>({ operators: {}, models: {}, producers: {} });
  const [adjustments, setAdjustments] = useState<any>({});
  const ASSIGNMENTS_API_URL = 'https://functions.poehali.dev/b7d8dd69-ab09-460d-999b-c0a1002ced30';
  const PRODUCER_API_URL = 'https://functions.poehali.dev/a480fde5-8cc8-42e8-a535-626e393f6fa6';
  const USERS_API_URL = 'https://functions.poehali.dev/67fd6902-6170-487e-bb46-f6d14ec99066';
  const SALARIES_API_URL = 'https://functions.poehali.dev/c430d601-e77e-494f-bf3a-73a45e7a5a4e';
  const ADJUSTMENTS_API_URL = 'https://functions.poehali.dev/d43e7388-65e1-4856-9631-1a460d38abd7';

  useEffect(() => {
    const email = localStorage.getItem('userEmail') || '';
    setUserEmail(email);
    loadUserRole(email);
    loadExchangeRate();
    loadUsers();
    loadAllAssignments();
    if (email) {
      loadProducerAssignments(email);
    }
  }, []);

  useEffect(() => {
    loadSalaries();
    loadAdjustments();
  }, [currentPeriod]);

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
    console.log('Loading role for email:', email);
    try {
      const response = await fetch('https://functions.poehali.dev/67fd6902-6170-487e-bb46-f6d14ec99066');
      const users = await response.json();
      console.log('All users:', users);
      const user = users.find((u: any) => u.email === email);
      console.log('Found user:', user);
      if (user) {
        setUserRole(user.role);
        console.log('Set role:', user.role);
      }
    } catch (err) {
      console.error('Failed to load user role', err);
    } finally {
      setIsLoadingRole(false);
      console.log('Loading finished, isLoadingRole set to false');
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch(USERS_API_URL);
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users', err);
    }
  };

  const loadAllAssignments = async () => {
    try {
      const response = await fetch(`${ASSIGNMENTS_API_URL}`);
      const assignments = await response.json();
      setAllAssignments(assignments);
    } catch (err) {
      console.error('Failed to load all assignments', err);
    }
  };

  const loadProducerAssignments = async (email: string) => {
    try {
      const response = await fetch(`${ASSIGNMENTS_API_URL}`);
      const assignments = await response.json();
      
      const producerModelResponse = await fetch(`${PRODUCER_API_URL}?producer=${encodeURIComponent(email)}&type=model`);
      const producerModelsData = await producerModelResponse.json();
      const producerModelEmails = producerModelsData.map((pm: any) => pm.modelEmail);
      
      const filteredAssignments = assignments.filter((a: any) => 
        producerModelEmails.includes(a.modelEmail)
      );
      
      setProducerModels(producerModelsData);
      setProducerAssignments(filteredAssignments);
    } catch (err) {
      console.error('Failed to load producer assignments', err);
    }
  };

  const loadSalaries = async () => {
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
        setSalaries(data);
      }
    } catch (err) {
      console.error('Failed to load salaries', err);
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
        setAdjustments(data);
      }
    } catch (err) {
      console.error('Failed to load adjustments', err);
    }
  };

  const handleUpdateProducer = async (email: string, field: 'expenses' | 'advance' | 'penalty', value: number) => {
    try {
      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const periodStart = formatDate(currentPeriod.startDate);
      const periodEnd = formatDate(currentPeriod.endDate);
      
      await fetch(ADJUSTMENTS_API_URL, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Email': userEmail
        },
        body: JSON.stringify({
          email,
          role: 'producer',
          period_start: periodStart,
          period_end: periodEnd,
          field,
          value
        })
      });
      
      await loadAdjustments();
    } catch (err) {
      console.error('Failed to update producer adjustment', err);
    }
  };

  const handleUpdateEmployee = async (email: string, field: 'advance' | 'penalty', value: number) => {
    try {
      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const periodStart = formatDate(currentPeriod.startDate);
      const periodEnd = formatDate(currentPeriod.endDate);
      
      const user = users.find(u => u.email === email);
      const role = user?.role === 'content_maker' ? 'model' : 'operator';
      
      await fetch(ADJUSTMENTS_API_URL, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Email': userEmail
        },
        body: JSON.stringify({
          email,
          role,
          period_start: periodStart,
          period_end: periodEnd,
          field,
          value
        })
      });
      
      await loadAdjustments();
    } catch (err) {
      console.error('Failed to update employee adjustment', err);
    }
  };

  const handleUpdateSoloPercentage = async (email: string, percentage: string) => {
    try {
      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const periodStart = formatDate(currentPeriod.startDate);
      const periodEnd = formatDate(currentPeriod.endDate);
      
      await fetch(ADJUSTMENTS_API_URL, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Email': userEmail
        },
        body: JSON.stringify({
          email,
          role: 'solo_maker',
          period_start: periodStart,
          period_end: periodEnd,
          field: 'percentage',
          value: percentage
        })
      });
      
      await loadAdjustments();
    } catch (err) {
      console.error('Failed to update solo maker percentage', err);
    }
  };

  let operators = producerData.employees.filter(e => e.model);
  let contentMakers = producerData.employees.filter(e => !e.model);
  let soloMakers: any[] = [];
  const producers = userRole === 'director' ? users.filter(u => u.role === 'producer').map(p => {
    const salary = salaries.producers[p.email] || { total: 0, details: [] };
    const adj = adjustments[p.email] || { expenses: 0, advance: 0, penalty: 0 };
    const sumDollars = salary.total;
    const sumRubles = sumDollars * exchangeRate;
    
    const producerModelEmails = salary.details.map((d: any) => d.model_email).filter((e: string) => e);
    const producerAssignmentsForThisProducer = allAssignments.filter((a: any) => 
      producerModelEmails.includes(a.modelEmail)
    );
    
    let averageProducerPercentage = 10;
    if (producerAssignmentsForThisProducer.length > 0) {
      const totalProducerPercentage = producerAssignmentsForThisProducer.reduce((sum: number, assignment: any) => {
        const operatorPercentage = assignment.operatorPercentage || 20;
        const producerPercentage = 30 - operatorPercentage;
        return sum + producerPercentage;
      }, 0);
      averageProducerPercentage = Math.round((totalProducerPercentage / producerAssignmentsForThisProducer.length) * 10) / 10;
    }
    
    return {
      name: p.fullName || p.email,
      email: p.email,
      sumDollars: Math.round(sumDollars * 100) / 100,
      rate: exchangeRate,
      sumRubles: Math.round(sumRubles),
      expenses: adj.expenses,
      advance: adj.advance,
      penalty: adj.penalty,
      total: Math.round(sumRubles + adj.expenses - adj.advance - adj.penalty),
      averageProducerPercentage
    };
  }) : [];
  
  if (userRole === 'director' && users.length > 0) {
    const operatorUsers = users.filter(u => u.role === 'operator');
    const modelUsers = users.filter(u => u.role === 'content_maker');
    
    operators = operatorUsers.map(op => {
      const salary = salaries.operators[op.email] || { total: 0, details: [] };
      const adj = adjustments[op.email] || { advance: 0, penalty: 0 };
      const sumDollars = salary.total;
      const sumRubles = sumDollars * exchangeRate;
      
      const operatorAssignments = allAssignments.filter(a => a.operatorEmail === op.email);
      let avgOperatorPercentage = 20;
      if (operatorAssignments.length > 0) {
        const totalOperatorPercentage = operatorAssignments.reduce((sum: number, a: any) => {
          return sum + (a.operatorPercentage || 20);
        }, 0);
        avgOperatorPercentage = Math.round((totalOperatorPercentage / operatorAssignments.length) * 10) / 10;
      }
      const avgProducerPercentage = Math.round((30 - avgOperatorPercentage) * 10) / 10;
      
      return {
        name: op.fullName || op.email,
        email: op.email,
        week: 0,
        shifts: salary.details.length,
        model: '',
        sumDollars: Math.round(sumDollars * 100) / 100,
        rate: exchangeRate,
        sumRubles: Math.round(sumRubles),
        advance: adj.advance,
        penalty: adj.penalty,
        total: Math.round(sumRubles - adj.advance - adj.penalty),
        operatorPercentage: avgOperatorPercentage,
        producerPercentage: avgProducerPercentage,
        role: 'operator'
      };
    });
    
    contentMakers = modelUsers.map(cm => {
      const salary = salaries.models[cm.email] || { total: 0, details: [] };
      const adj = adjustments[cm.email] || { advance: 0, penalty: 0 };
      const sumDollars = salary.total;
      const sumRubles = sumDollars * exchangeRate;
      return {
        name: cm.fullName || cm.email,
        email: cm.email,
        week: 0,
        model: '',
        sumDollars: Math.round(sumDollars * 100) / 100,
        rate: exchangeRate,
        sumRubles: Math.round(sumRubles),
        advance: adj.advance,
        penalty: adj.penalty,
        total: Math.round(sumRubles - adj.advance - adj.penalty)
      };
    });
    
    const soloMakerUsers = users.filter(u => u.role === 'solo_maker');
    soloMakers = soloMakerUsers.map(sm => {
      const salary = salaries.models[sm.email] || { total: 0, details: [] };
      const adj = adjustments[sm.email] || { advance: 0, penalty: 0 };
      const sumDollars = salary.total;
      const sumRubles = sumDollars * exchangeRate;
      return {
        name: sm.fullName || sm.email,
        email: sm.email,
        week: 0,
        model: '',
        sumDollars: Math.round(sumDollars * 100) / 100,
        rate: exchangeRate,
        sumRubles: Math.round(sumRubles),
        advance: adj.advance,
        penalty: adj.penalty,
        total: Math.round(sumRubles - adj.advance - adj.penalty)
      };
    });
  } else if (userRole === 'producer' && producerModels.length > 0 && users.length > 0) {
    const assignedOperatorEmails = producerAssignments.map(a => a.operatorEmail);
    const assignedModelEmails = producerModels.map((pm: any) => pm.modelEmail);
    
    const operatorUsers = users.filter(u => u.role === 'operator' && assignedOperatorEmails.includes(u.email));
    const modelUsers = users.filter(u => u.role === 'content_maker' && assignedModelEmails.includes(u.email));
    
    operators = operatorUsers.map(op => {
      const assignment = producerAssignments.find(a => a.operatorEmail === op.email);
      const modelUser = users.find(u => u.email === assignment?.modelEmail);
      const salary = salaries.operators[op.email] || { total: 0, details: [] };
      const adj = adjustments[op.email] || { advance: 0, penalty: 0 };
      const sumDollars = salary.total;
      const sumRubles = sumDollars * exchangeRate;
      
      const operatorPercentage = assignment?.operatorPercentage || 20;
      const producerPercentage = 30 - operatorPercentage;
      
      return {
        name: op.fullName || op.email,
        email: op.email,
        week: 0,
        shifts: salary.details.length,
        model: modelUser?.fullName || assignment?.modelEmail || '',
        sumDollars: Math.round(sumDollars * 100) / 100,
        rate: exchangeRate,
        sumRubles: Math.round(sumRubles),
        advance: adj.advance,
        penalty: adj.penalty,
        total: Math.round(sumRubles - adj.advance - adj.penalty),
        operatorPercentage,
        producerPercentage,
        role: 'operator'
      };
    });
    
    contentMakers = modelUsers.map(cm => {
      const salary = salaries.models[cm.email] || { total: 0, details: [] };
      const adj = adjustments[cm.email] || { advance: 0, penalty: 0 };
      const sumDollars = salary.total;
      const sumRubles = sumDollars * exchangeRate;
      return {
        name: cm.fullName || cm.email,
        email: cm.email,
        week: 0,
        model: '',
        sumDollars: Math.round(sumDollars * 100) / 100,
        rate: exchangeRate,
        sumRubles: Math.round(sumRubles),
        advance: adj.advance,
        penalty: adj.penalty,
        total: Math.round(sumRubles - adj.advance - adj.penalty)
      };
    });
  }

  const totalModelSum = Math.round(contentMakers.reduce((sum, e) => sum + (e.sumRubles || 0), 0));
  let totalOperatorSum = Math.round(operators.reduce((sum, e) => sum + (e.sumRubles || 0), 0));
  
  if (userRole === 'producer') {
    const producerSalary = salaries.producers[userEmail] || { total: 0, details: [] };
    const producerTotalSum = Math.round(producerSalary.total * exchangeRate);
    totalOperatorSum += producerTotalSum;
  } else if (userRole === 'director') {
    const producerUsers = users.filter(u => u.role === 'producer');
    producerUsers.forEach(prod => {
      const salary = salaries.producers[prod.email] || { total: 0, details: [] };
      const producerTotalSum = Math.round(salary.total * exchangeRate);
      totalOperatorSum += producerTotalSum;
    });
  }

  if (isLoadingRole) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-serif font-bold text-foreground mb-2">Чеки</h2>
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

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
          <div className="flex items-center gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPeriod(getPreviousPeriod(currentPeriod))}
            >
              <Icon name="ChevronLeft" size={16} />
            </Button>
            <div className="font-semibold text-lg flex-1 text-center">
              {currentPeriod.label}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPeriod(getNextPeriod(currentPeriod))}
            >
              <Icon name="ChevronRight" size={16} />
            </Button>
          </div>
        </Card>
        
        <Card className="p-4 bg-green-500/10 border-green-500/20">
          <div className="text-sm text-muted-foreground mb-1">Сумма моделей</div>
          <div className="text-2xl font-bold text-green-600">{totalModelSum.toLocaleString()}₽</div>
        </Card>

        <Card className="p-4 bg-green-500/10 border-green-500/20">
          <div className="text-sm text-muted-foreground mb-1">Сумма операторов</div>
          <div className="text-2xl font-bold text-green-600">{totalOperatorSum.toLocaleString()}₽</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ExchangeRateCard 
          exchangeRate={exchangeRate}
          isLoadingRate={isLoadingRate}
          onRefresh={loadExchangeRate}
        />
      </div>

      {userRole === 'producer' && (() => {
        const salary = salaries.producers[userEmail] || { total: 0, details: [] };
        const adj = adjustments[userEmail] || { expenses: 0, advance: 0, penalty: 0 };
        const sumDollars = salary.total;
        const sumRubles = sumDollars * exchangeRate;
        
        return (
          <ProducerSalaryCard 
            producerData={{
              name: users.find(u => u.email === userEmail)?.fullName || userEmail,
              email: userEmail,
              period: currentPeriod.label,
              sumDollars: Math.round(sumDollars * 100) / 100,
              rate: exchangeRate,
              sumRubles: Math.round(sumRubles),
              expenses: adj.expenses,
              advance: adj.advance,
              penalty: adj.penalty,
              total: Math.round(sumRubles + adj.expenses - adj.advance - adj.penalty),
              employees: []
            }} 
            period={currentPeriod}
            canEdit={true}
            onUpdate={handleUpdateProducer}
          />
        );
      })()}

      <div className="space-y-8">
        {userRole === 'director' && producers.length > 0 && (
          <ProducersSection 
            producers={producers} 
            period={currentPeriod} 
            canEdit={true}
            onUpdate={handleUpdateProducer}
          />
        )}
        <OperatorsSection 
          operators={operators} 
          period={currentPeriod} 
          canEdit={true}
          onUpdate={handleUpdateEmployee}
        />
        <ContentMakersSection 
          contentMakers={contentMakers} 
          period={currentPeriod} 
          canEdit={true}
          onUpdate={handleUpdateEmployee}
        />
        {userRole === 'director' && soloMakers.length > 0 && (
          <SoloMakersSection 
            soloMakers={soloMakers} 
            period={currentPeriod} 
            canEdit={true}
            onUpdate={handleUpdateEmployee}
            onPercentageUpdate={handleUpdateSoloPercentage}
          />
        )}
      </div>
    </div>
  );
};

export default memo(ChecksTab);