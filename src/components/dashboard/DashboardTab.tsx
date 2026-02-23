import { useState, useEffect, useRef } from 'react';
import { getCurrentPeriod, getPreviousPeriod, getNextPeriod, Period } from '@/utils/periodUtils';
import { authenticatedFetch } from '@/lib/api';
import DashboardWelcomeCard from './DashboardWelcomeCard';
import DashboardPeriodSelector from './DashboardPeriodSelector';
import DashboardSalaryCard from './DashboardSalaryCard';
import DashboardProducerCard from './DashboardProducerCard';

const USERS_API_URL = 'https://functions.poehali.dev/67fd6902-6170-487e-bb46-f6d14ec99066';
const SALARIES_API_URL = 'https://functions.poehali.dev/c430d601-e77e-494f-bf3a-73a45e7a5a4e';
const EXCHANGE_RATE_API_URL = 'https://functions.poehali.dev/be3de232-e5c9-421e-8335-c4f67a2d744a';
const PRODUCER_API_URL = 'https://functions.poehali.dev/a480fde5-8cc8-42e8-a535-626e393f6fa6';
const ASSIGNMENTS_API_URL = 'https://functions.poehali.dev/b7d8dd69-ab09-460d-999b-c0a1002ced30';
const ADJUSTMENTS_API_URL = 'https://functions.poehali.dev/d43e7388-65e1-4856-9631-1a460d38abd7';

interface DashboardTabProps {
  monthlyRevenue?: any;
  onNavigate?: (tab: string) => void;
  onViewFinances?: (modelId: number, modelName: string) => void;
}

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
  const [adjustments, setAdjustments] = useState<{advance: number, penalty: number, expenses?: number}>({advance: 0, penalty: 0, expenses: 0});

  const emailRef = useRef('');
  const roleRef = useRef('');

  useEffect(() => {
    const email = localStorage.getItem('userEmail') || '';
    emailRef.current = email;
    setUserEmail(email);
    if (email) {
      loadInitialData(email);
    }
    loadExchangeRate();
  }, []);

  useEffect(() => {
    if (emailRef.current && roleRef.current) {
      loadPeriodData(emailRef.current, currentPeriod);
    }
  }, [currentPeriod]);

  const loadExchangeRate = async () => {
    try {
      const response = await authenticatedFetch(EXCHANGE_RATE_API_URL);
      const data = await response.json();
      if (data.rate) {
        setExchangeRate(data.rate - 5);
      }
    } catch (error) {
      console.error('Failed to load exchange rate:', error);
    }
  };

  const loadInitialData = async (email: string) => {
    try {
      const response = await authenticatedFetch(USERS_API_URL);
      const users = await response.json();
      const currentUser = users.find((u: any) => u.email === email);

      if (!currentUser) return;

      const role = currentUser.role;
      roleRef.current = role;
      setUserRole(role);
      setUserFullName(currentUser.fullName || email);
      setUserId(currentUser.id);

      resolveProducerName(email, role, users);

      await loadPeriodData(email, currentPeriod);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const resolveProducerName = async (email: string, role: string, users: any[]) => {
    try {
      if (role === 'operator') {
        const [assignmentsRes, producerRes] = await Promise.all([
          authenticatedFetch(ASSIGNMENTS_API_URL),
          authenticatedFetch(`${PRODUCER_API_URL}?type=model`),
        ]);
        const assignments = await assignmentsRes.json();
        const producerAssignments = await producerRes.json();

        const operatorAssignment = assignments.find((a: any) => a.operatorEmail === email);
        if (operatorAssignment) {
          const pa = producerAssignments.find((p: any) => p.modelEmail === operatorAssignment.modelEmail);
          if (pa) {
            const producer = users.find((u: any) => u.email === pa.producerEmail);
            if (producer) setProducerName(producer.fullName || producer.email);
          }
        }
      } else if (role === 'content_maker' || role === 'solo_maker') {
        const producerRes = await authenticatedFetch(`${PRODUCER_API_URL}?type=model`);
        const producerAssignments = await producerRes.json();
        const pa = producerAssignments.find((p: any) => p.modelEmail === email);
        if (pa) {
          const producer = users.find((u: any) => u.email === pa.producerEmail);
          if (producer) setProducerName(producer.fullName || producer.email);
        }
      }
    } catch (error) {
      console.error('Failed to resolve producer name:', error);
    }
  };

  const loadPeriodData = async (email: string, period: Period) => {
    setIsLoading(true);
    const periodStart = formatDate(period.startDate);
    const periodEnd = formatDate(period.endDate);

    try {
      const [salariesRes, adjustmentsRes] = await Promise.all([
        authenticatedFetch(`${SALARIES_API_URL}?period_start=${periodStart}&period_end=${periodEnd}`),
        authenticatedFetch(`${ADJUSTMENTS_API_URL}?period_start=${periodStart}&period_end=${periodEnd}`),
      ]);

      if (salariesRes.ok) {
        const data = await salariesRes.json();
        let salary = null;
        if (data.operators[email]) {
          salary = { ...data.operators[email], type: 'operator' };
        } else if (data.models[email]) {
          salary = { ...data.models[email], type: 'model' };
        } else if (data.producers[email]) {
          salary = { ...data.producers[email], type: 'producer' };
        }
        setSalaryData(salary);
      }

      if (adjustmentsRes.ok) {
        const data = await adjustmentsRes.json();
        setAdjustments(data[email] || { advance: 0, penalty: 0, expenses: 0 });
      }
    } catch (error) {
      console.error('Failed to load period data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviousPeriod = () => {
    setCurrentPeriod(getPreviousPeriod(currentPeriod));
  };

  const handleNextPeriod = () => {
    setCurrentPeriod(getNextPeriod(currentPeriod));
  };

  const salaryInRubles = salaryData ? Math.round((salaryData.total * exchangeRate) + (adjustments.expenses || 0) - adjustments.advance - adjustments.penalty) : 0;
  const salaryInDollars = salaryData ? Math.round(salaryData.total * 100) / 100 : 0;

  return (
    <div className="space-y-6">
      <DashboardWelcomeCard 
        userFullName={userFullName}
        userRole={userRole}
      />

      <DashboardPeriodSelector
        currentPeriod={currentPeriod}
        onPreviousPeriod={handlePreviousPeriod}
        onNextPeriod={handleNextPeriod}
      />

      <DashboardSalaryCard
        isLoading={isLoading}
        salaryInRubles={salaryInRubles}
        salaryInDollars={salaryInDollars}
        exchangeRate={exchangeRate}
        adjustments={adjustments}
        salaryData={salaryData}
      />

      <DashboardProducerCard producerName={producerName} />
    </div>
  );
};

export default DashboardTab;
