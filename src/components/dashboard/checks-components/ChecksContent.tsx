import ExchangeRateCard from '../checks/ExchangeRateCard';
import ProducerSalaryCard from '../checks/ProducerSalaryCard';
import ProducersSection from '../checks/ProducersSection';
import OperatorsSection from '../checks/OperatorsSection';
import ContentMakersSection from '../checks/ContentMakersSection';
import SoloMakersSection from '../checks/SoloMakersSection';
import { Period } from '@/utils/periodUtils';

interface Producer {
  name: string;
  email: string;
  sumDollars: number;
  rate: number;
  sumRubles: number;
  expenses: number;
  advance: number;
  penalty: number;
  total: number;
  averageProducerPercentage: number;
}

interface Operator {
  name: string;
  email: string;
  week: number;
  shifts: number;
  model: string;
  sumDollars: number;
  rate: number;
  sumRubles: number;
  advance: number;
  penalty: number;
  total: number;
  operatorPercentage: number;
  producerPercentage: number;
  role: string;
}

interface ContentMaker {
  name: string;
  email: string;
  week: number;
  model: string;
  sumDollars: number;
  rate: number;
  sumRubles: number;
  advance: number;
  penalty: number;
  total: number;
}

interface SoloMaker {
  name: string;
  email: string;
  week: number;
  model: string;
  sumDollars: number;
  rate: number;
  sumRubles: number;
  advance: number;
  penalty: number;
  total: number;
  role: string;
  soloPercentage: string;
}

interface ChecksContentProps {
  userRole: string | null;
  userEmail: string;
  currentPeriod: Period;
  exchangeRate: number;
  isLoadingRate: boolean;
  producers: Producer[];
  operators: Operator[];
  contentMakers: ContentMaker[];
  soloMakers: SoloMaker[];
  users: any[];
  salaries: any;
  adjustments: any;
  onRefreshRate: () => void;
  onUpdateProducer: (email: string, field: 'expenses' | 'advance' | 'penalty', value: number) => void;
  onUpdateEmployee: (email: string, field: 'advance' | 'penalty', value: number) => void;
}

const ChecksContent = ({
  userRole,
  userEmail,
  currentPeriod,
  exchangeRate,
  isLoadingRate,
  producers,
  operators,
  contentMakers,
  soloMakers,
  users,
  salaries,
  adjustments,
  onRefreshRate,
  onUpdateProducer,
  onUpdateEmployee
}: ChecksContentProps) => {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ExchangeRateCard 
          exchangeRate={exchangeRate}
          isLoadingRate={isLoadingRate}
          onRefresh={onRefreshRate}
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
            onUpdate={onUpdateProducer}
          />
        );
      })()}

      <div className="space-y-8">
        {userRole === 'director' && producers.length > 0 && (
          <ProducersSection 
            producers={producers} 
            period={currentPeriod} 
            canEdit={true}
            onUpdate={onUpdateProducer}
          />
        )}
        <OperatorsSection 
          operators={operators} 
          period={currentPeriod} 
          canEdit={true}
          onUpdate={onUpdateEmployee}
        />
        <ContentMakersSection 
          contentMakers={contentMakers} 
          period={currentPeriod} 
          canEdit={true}
          onUpdate={onUpdateEmployee}
        />
        {userRole === 'director' && soloMakers.length > 0 && (
          <SoloMakersSection 
            soloMakers={soloMakers} 
            period={currentPeriod} 
            canEdit={true}
            onUpdate={onUpdateEmployee}
          />
        )}
      </div>
    </>
  );
};

export default ChecksContent;
