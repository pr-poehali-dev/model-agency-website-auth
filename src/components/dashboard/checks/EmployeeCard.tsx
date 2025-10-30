import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Employee } from './types';

interface EmployeeCardProps {
  employee: Employee;
  color: 'blue' | 'purple' | 'red';
  icon?: string;
}

const EmployeeCard = ({ employee, color, icon }: EmployeeCardProps) => {
  const colorClasses = {
    blue: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30',
    purple: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
    red: 'from-red-500/20 to-orange-500/20 border-red-500/30'
  };

  const iconClasses = {
    blue: 'text-blue-500',
    purple: 'text-purple-500',
    red: 'text-red-500'
  };

  return (
    <Card className={`overflow-hidden border-2 ${colorClasses[color].split(' ')[2]} shadow-lg`}>
      <div className={`bg-gradient-to-r ${colorClasses[color].split(' ').slice(0, 2).join(' ')} p-4 text-center border-b-2 ${colorClasses[color].split(' ')[2]}`}>
        <div className="flex items-center justify-center gap-3">
          {icon && <Icon name={icon} size={24} className={iconClasses[color]} />}
          <h3 className="text-xl font-serif font-bold">{employee.name}</h3>
        </div>
      </div>
      
      <div className="p-6 space-y-3">
        {employee.week && (
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground">Неделя</span>
            <span className="font-semibold text-lg">{employee.week}</span>
          </div>
        )}
        
        {employee.shifts && (
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground">Кол-во смен</span>
            <span className="font-semibold text-lg">{employee.shifts}</span>
          </div>
        )}
        
        {employee.model && (
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-muted-foreground">Модель</span>
            <span className="font-semibold text-lg">{employee.model}</span>
          </div>
        )}
        
        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-muted-foreground">Сумма $</span>
          <span className="font-semibold text-lg">${employee.sumDollars.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-muted-foreground">Курс</span>
          <span className="font-semibold text-lg">{employee.rate}</span>
        </div>
        
        <div className="flex justify-between items-center py-3 px-4 bg-green-500/10 rounded-lg border border-green-500/20">
          <span className="font-medium">Сумма ₽</span>
          <span className="font-bold text-xl">{employee.sumRubles.toLocaleString()}₽</span>
        </div>
        
        <div className="flex justify-between items-center py-3 px-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
          <span className="font-medium">Аванс</span>
          <span className="font-bold text-xl text-yellow-600 dark:text-yellow-400">{employee.advance.toLocaleString()}₽</span>
        </div>
        
        <div className="flex justify-between items-center py-3 px-4 bg-red-500/10 rounded-lg border border-red-500/20">
          <span className="font-medium">Штраф</span>
          <span className="font-bold text-xl text-red-600 dark:text-red-400">{employee.penalty.toLocaleString()}₽</span>
        </div>
        
        <div className="flex justify-between items-center py-4 px-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg border-2 border-green-500/40 mt-4">
          <span className="font-bold text-lg">Итог</span>
          <span className="font-bold text-2xl text-green-600 dark:text-green-400">{employee.total.toLocaleString()}₽</span>
        </div>
      </div>
    </Card>
  );
};

export default EmployeeCard;
