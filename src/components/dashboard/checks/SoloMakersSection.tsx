import Icon from '@/components/ui/icon';
import { Employee } from './types';
import { Period } from '@/utils/periodUtils';
import EmployeeCard from './EmployeeCard';

interface SoloMakersSectionProps {
  soloMakers: Employee[];
  period: Period;
  canEdit?: boolean;
  onUpdate?: (email: string, field: 'advance' | 'penalty', value: number) => void;
}

const SoloMakersSection = ({ soloMakers, period, canEdit, onUpdate }: SoloMakersSectionProps) => {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Icon name="Star" size={24} className="text-purple-500" />
        <h3 className="text-2xl font-serif font-bold">Соло-мейкеры</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {soloMakers.map((employee, index) => (
          <EmployeeCard 
            key={index} 
            employee={employee} 
            color="purple"
            icon="Star"
            canEdit={canEdit}
            onUpdate={onUpdate}
          />
        ))}
      </div>
    </div>
  );
};

export default SoloMakersSection;