import Icon from '@/components/ui/icon';
import { Employee } from './types';
import { Period } from '@/utils/periodUtils';
import EmployeeCard from './EmployeeCard';

interface OperatorsSectionProps {
  operators: Employee[];
  period: Period;
}

const OperatorsSection = ({ operators, period }: OperatorsSectionProps) => {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Icon name="Users" size={24} className="text-blue-500" />
        <h3 className="text-2xl font-serif font-bold">Операторы</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {operators.map((employee, index) => (
          <EmployeeCard 
            key={index} 
            employee={employee} 
            color="blue"
            icon="Headphones"
          />
        ))}
      </div>
    </div>
  );
};

export default OperatorsSection;