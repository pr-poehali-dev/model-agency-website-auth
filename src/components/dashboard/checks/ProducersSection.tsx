import Icon from '@/components/ui/icon';
import { ProducerData } from './types';
import { Period } from '@/utils/periodUtils';
import ProducerSalaryCard from './ProducerSalaryCard';

interface ProducersSectionProps {
  producers: ProducerData[];
  period: Period;
  canEdit?: boolean;
  onUpdate?: (email: string, field: 'expenses' | 'advance' | 'penalty', value: number) => void;
}

const ProducersSection = ({ producers, period, canEdit, onUpdate }: ProducersSectionProps) => {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Icon name="Crown" size={24} className="text-red-500" />
        <h3 className="text-2xl font-serif font-bold">Продюсеры</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {producers.map((producer, index) => (
          <ProducerSalaryCard 
            key={index} 
            producerData={producer} 
            period={period}
            canEdit={canEdit}
            onUpdate={onUpdate}
          />
        ))}
      </div>
    </div>
  );
};

export default ProducersSection;