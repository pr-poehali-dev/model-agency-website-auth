import { useState, useEffect } from 'react';
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
      const response = await authenticatedFetch(EXCHANGE_RATE_API_URL);
      const data = await response.json();
      if (data.rate) {
        setExchangeRate(data.rate - 5);
      }
    } catch (error) {
      console.error('Failed to load exchange rate:', error);
    }
  };

  const loadUserData = async (email: string) => {
    try {
      const response = await authenticatedFetch(USERS_API_URL);
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
      const usersResponse = await authenticatedFetch(USERS_API_URL);
      const users = await usersResponse.json();
      const currentUser = users.find((u: any) => u.email === email);
      
      if (!currentUser) return;
      
      if (currentUser.role === 'operator') {
        const assignmentsResponse = await authenticatedFetch(ASSIGNMENTS_API_URL);
        const assignments = await assignmentsResponse.json();
        const operatorAssignment = assignments.find((a: any) => a.operatorEmail === email);
        
        if (operatorAssignment) {
          const producerResponse = await authenticatedFetch(`${PRODUCER_API_URL}?type=model`);
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
      } else if (currentUser.role === 'content_maker' || currentUser.role === 'solo_maker') {
        const producerResponse = await authenticatedFetch(`${PRODUCER_API_URL}?type=model`);
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
      
      const response = await authenticatedFetch(`${SALARIES_API_URL}?period_start=${periodStart}&period_end=${periodEnd}`);
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
      
      const response = await authenticatedFetch(`${ADJUSTMENTS_API_URL}?period_start=${periodStart}&period_end=${periodEnd}`);
      if (response.ok) {
        const data = await response.json();
        const userAdj = data[userEmail] || {advance: 0, penalty: 0, expenses: 0};
        setAdjustments(userAdj);
      }
    } catch (error) {
      console.error('Failed to load adjustments:', error);
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