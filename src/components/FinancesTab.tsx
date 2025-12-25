import { useState, memo } from 'react';
import FinancesHeader from './finances/FinancesHeader';
import StatsCards from './finances/StatsCards';
import ChartsSection from './finances/ChartsSection';
import PlatformTables from './finances/PlatformTables';
import ProductionMonitoring from './finances/ProductionMonitoring';
import DirectorsSalary from './finances/DirectorsSalary';
import { getCurrentPeriod, getPreviousPeriod, getNextPeriod, getCurrentWeek, getPreviousWeek, getNextWeek, getWeeksBetween, Period } from '@/utils/periodUtils';

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
  const [directorsPeriod, setDirectorsPeriod] = useState<Period>(getCurrentWeek());
  const [producersData, setProducersData] = useState<ProducerData[]>([]);

  const handlePreviousPeriod = () => {
    setCurrentPeriod(prev => getPreviousPeriod(prev));
  };

  const handleNextPeriod = () => {
    setCurrentPeriod(prev => getNextPeriod(prev));
  };

  const handleDirectorsPreviousPeriod = () => {
    setDirectorsPeriod(prev => {
      const currentWeekRef = getCurrentWeek();
      const newWeek = getPreviousWeek(prev);
      
      // Считаем количество недель назад от текущей
      const weeksBack = getWeeksBetween(newWeek, currentWeekRef);
      
      // Разрешаем максимум 3 недели назад
      if (weeksBack <= 3) {
        return newWeek;
      }
      return prev;
    });
  };

  const handleDirectorsNextPeriod = () => {
    setDirectorsPeriod(prev => {
      const currentWeekRef = getCurrentWeek();
      const newWeek = getNextWeek(prev);
      
      // Считаем количество недель вперед от текущей
      const weeksForward = getWeeksBetween(currentWeekRef, newWeek);
      
      // Разрешаем максимум 1 неделю вперед
      if (weeksForward <= 1) {
        return newWeek;
      }
      return prev;
    });
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
            productionData={producersData}
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