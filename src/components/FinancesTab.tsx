import { useState, memo } from 'react';
import FinancesHeader from './finances/FinancesHeader';
import StatsCards from './finances/StatsCards';
import ChartsSection from './finances/ChartsSection';
import PlatformTables from './finances/PlatformTables';
import ProductionMonitoring from './finances/ProductionMonitoring';
import DirectorsSalary from './finances/DirectorsSalary';
import { getCurrentPeriod, getPreviousPeriod, getNextPeriod, Period } from '@/utils/periodUtils';

interface Transaction {
  id: number;
  date: string;
  model: string;
  project: string;
  amount: number;
  status: string;
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
  bookings: number;
}

interface ModelPerformance {
  name: string;
  earnings: number;
}

interface FinancesTabProps {
  transactions: Transaction[];
  monthlyRevenue: MonthlyRevenue[];
  modelPerformance: ModelPerformance[];
  userEmail?: string;
  userRole?: string;
}

interface ProducerData {
  models: Array<{
    name: string;
    email: string;
    current_income: number;
  }>;
}

const FinancesTab = ({ transactions, monthlyRevenue, modelPerformance, userEmail = '', userRole = '' }: FinancesTabProps) => {
  const [dateFilter, setDateFilter] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [currentPeriod, setCurrentPeriod] = useState<Period>(getCurrentPeriod());
  const [directorsPeriod, setDirectorsPeriod] = useState<Period>(getCurrentPeriod());
  const [producersData, setProducersData] = useState<ProducerData[]>([]);

  const handlePreviousPeriod = () => {
    setCurrentPeriod(prev => getPreviousPeriod(prev));
  };

  const handleNextPeriod = () => {
    setCurrentPeriod(prev => getNextPeriod(prev));
  };

  const handleDirectorsPreviousPeriod = () => {
    setDirectorsPeriod(prev => {
      const currentRef = getCurrentPeriod();
      const newPeriod = getPreviousPeriod(prev);
      
      // Считаем количество полупериодов назад от текущего
      const periodsBack = countPeriodsBetween(newPeriod, currentRef);
      
      // Разрешаем максимум 6 полупериодов назад (3 недели = 6 полупериодов)
      if (periodsBack <= 6) {
        return newPeriod;
      }
      return prev;
    });
  };

  const handleDirectorsNextPeriod = () => {
    setDirectorsPeriod(prev => {
      const currentRef = getCurrentPeriod();
      const newPeriod = getNextPeriod(prev);
      
      // Считаем количество полупериодов вперед от текущего
      const periodsForward = countPeriodsBetween(currentRef, newPeriod);
      
      // Разрешаем максимум 2 полупериода вперед (1 неделя = 2 полупериода)
      if (periodsForward <= 2) {
        return newPeriod;
      }
      return prev;
    });
  };

  // Функция для подсчета количества полупериодов между двумя периодами
  const countPeriodsBetween = (from: Period, to: Period): number => {
    let count = 0;
    let current = from;
    
    while (current.startDate < to.startDate && count < 20) {
      current = getNextPeriod(current);
      count++;
    }
    
    return count;
  };

  const handleDataLoaded = (data: ProducerData[]) => {
    setProducersData(data);
  };

  const filteredTransactions = transactions.filter(t => {
    if (statusFilter === 'paid') return t.status === 'Paid';
    if (statusFilter === 'pending') return t.status === 'Pending';
    return true;
  });

  const totalRevenue = filteredTransactions.reduce((sum, t) => sum + (t.status === 'Paid' ? t.amount : 0), 0);
  const pendingPayments = filteredTransactions.filter(t => t.status === 'Pending').length;
  const currentMonthRevenue = monthlyRevenue[monthlyRevenue.length - 1]?.revenue || 0;

  if (userRole === 'producer' || userRole === 'director') {
    return (
      <div className="animate-fade-in space-y-6">
        <ProductionMonitoring 
          userEmail={userEmail}
          userRole={userRole}
          period={currentPeriod}
          onPreviousPeriod={handlePreviousPeriod}
          onNextPeriod={handleNextPeriod}
          onDataLoaded={handleDataLoaded}
        />
        {userRole === 'director' && (
          <DirectorsSalary 
            userEmail={userEmail}
            period={directorsPeriod}
            onPreviousPeriod={handleDirectorsPreviousPeriod}
            onNextPeriod={handleDirectorsNextPeriod}
          />
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <FinancesHeader 
        dateFilter={dateFilter}
        statusFilter={statusFilter}
        onDateFilterChange={setDateFilter}
        onStatusFilterChange={setStatusFilter}
      />

      <StatsCards 
        totalRevenue={totalRevenue}
        monthlyRevenue={currentMonthRevenue}
        pendingPayments={pendingPayments}
      />

      <ChartsSection 
        monthlyRevenue={monthlyRevenue}
        modelPerformance={modelPerformance}
      />

      <PlatformTables period={currentPeriod} />
    </div>
  );
};

export default memo(FinancesTab);