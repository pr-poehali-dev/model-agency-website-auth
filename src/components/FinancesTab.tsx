import { useState } from 'react';
import FinancesHeader from './finances/FinancesHeader';
import StatsCards from './finances/StatsCards';
import ChartsSection from './finances/ChartsSection';
import PlatformTables from './finances/PlatformTables';

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
}

const FinancesTab = ({ transactions, monthlyRevenue, modelPerformance }: FinancesTabProps) => {
  const [dateFilter, setDateFilter] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');

  const filteredTransactions = transactions.filter(t => {
    if (statusFilter === 'paid') return t.status === 'Paid';
    if (statusFilter === 'pending') return t.status === 'Pending';
    return true;
  });

  const totalRevenue = filteredTransactions.reduce((sum, t) => sum + (t.status === 'Paid' ? t.amount : 0), 0);
  const pendingPayments = filteredTransactions.filter(t => t.status === 'Pending').length;
  const currentMonthRevenue = monthlyRevenue[monthlyRevenue.length - 1]?.revenue || 0;

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

      <PlatformTables />
    </div>
  );
};

export default FinancesTab;
