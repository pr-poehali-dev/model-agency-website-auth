import { useState, memo } from 'react';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { getCurrentPeriod, Period } from '@/utils/periodUtils';
import { useChecksData } from './checks-components/useChecksData';
import ChecksHeader from './checks-components/ChecksHeader';
import ChecksContent from './checks-components/ChecksContent';
import { producerData } from './checks/mockData';

const ChecksTab = () => {
  const [currentPeriod, setCurrentPeriod] = useState<Period>(getCurrentPeriod());
  
  const {
    exchangeRate,
    userRole,
    userEmail,
    isLoadingRole,
    isLoadingRate,
    producerModels,
    producerOperators,
    allAssignments,
    users,
    salaries,
    adjustments,
    loadExchangeRate,
    handleUpdateProducer,
    handleUpdateEmployee
  } = useChecksData(currentPeriod);

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
        total: Math.round(sumRubles - adj.advance - adj.penalty),
        role: 'solo_maker',
        soloPercentage: sm.soloPercentage || '50'
      };
    });
  } else if (userRole === 'producer' && users.length > 0) {
    const assignedOperatorEmails = producerOperators.map((po: any) => po.operatorEmail);
    const assignedModelEmails = producerModels.map((pm: any) => pm.modelEmail);
    
    const operatorUsers = users.filter(u => u.role === 'operator' && assignedOperatorEmails.includes(u.email));
    const modelUsers = users.filter(u => u.role === 'content_maker' && assignedModelEmails.includes(u.email));
    
    operators = operatorUsers.map(op => {
      const operatorAssignments = allAssignments.filter(a => a.operatorEmail === op.email);
      const firstAssignment = operatorAssignments[0];
      const modelUser = users.find(u => u.email === firstAssignment?.modelEmail);
      const salary = salaries.operators[op.email] || { total: 0, details: [] };
      const adj = adjustments[op.email] || { advance: 0, penalty: 0 };
      const sumDollars = salary.total;
      const sumRubles = sumDollars * exchangeRate;
      
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
        model: modelUser?.fullName || firstAssignment?.modelEmail || '',
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
  }

  const totalModelSum = Math.round(contentMakers.reduce((sum, e) => sum + (e.total || 0), 0));
  const totalSoloMakerSum = Math.round(soloMakers.reduce((sum, e) => sum + (e.total || 0), 0));
  let totalOperatorSum = Math.round(operators.reduce((sum, e) => sum + (e.total || 0), 0));
  
  if (userRole === 'producer') {
    const producerSalary = salaries.producers[userEmail] || { total: 0, details: [] };
    const producerTotalSum = Math.round(producerSalary.total * exchangeRate);
    totalOperatorSum += producerTotalSum;
  } else if (userRole === 'director') {
    const producerUsers = users.filter(u => u.role === 'producer');
    producerUsers.forEach(prod => {
      const salary = salaries.producers[prod.email] || { total: 0, details: [] };
      const adj = adjustments[prod.email] || { expenses: 0, advance: 0, penalty: 0 };
      const sumRubles = salary.total * exchangeRate;
      const producerTotalSum = Math.round(sumRubles + adj.expenses - adj.advance - adj.penalty);
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
      <ChecksHeader
        currentPeriod={currentPeriod}
        onPeriodChange={setCurrentPeriod}
        totalModelSum={totalModelSum}
        totalOperatorSum={totalOperatorSum}
        totalSoloMakerSum={totalSoloMakerSum}
        userRole={userRole}
        soloMakersCount={soloMakers.length}
      />

      <ChecksContent
        userRole={userRole}
        userEmail={userEmail}
        currentPeriod={currentPeriod}
        exchangeRate={exchangeRate}
        isLoadingRate={isLoadingRate}
        producers={producers}
        operators={operators}
        contentMakers={contentMakers}
        soloMakers={soloMakers}
        users={users}
        salaries={salaries}
        adjustments={adjustments}
        onRefreshRate={loadExchangeRate}
        onUpdateProducer={handleUpdateProducer}
        onUpdateEmployee={handleUpdateEmployee}
      />
    </div>
  );
};

export default memo(ChecksTab);
