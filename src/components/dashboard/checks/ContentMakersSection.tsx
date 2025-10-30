import Icon from '@/components/ui/icon';
import { Employee } from './types';
import { Period } from '@/utils/periodUtils';
import EmployeeCard from './EmployeeCard';

interface ContentMakersSectionProps {
  contentMakers: Employee[];
  period: Period;
}

const ContentMakersSection = ({ contentMakers, period }: ContentMakersSectionProps) => {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Icon name="Video" size={24} className="text-purple-500" />
        <h3 className="text-2xl font-serif font-bold">Контент-мейкеры</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contentMakers.map((employee, index) => (
          <EmployeeCard 
            key={index} 
            employee={employee} 
            color="purple"
            icon="Camera"
          />
        ))}
      </div>
    </div>
  );
};

export default ContentMakersSection;