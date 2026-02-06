import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Employee } from './types';
import { useState, useEffect } from 'react';

interface EmployeeCardProps {
  employee: Employee;
  color: 'emerald' | 'amber' | 'red' | 'purple';
  icon?: string;
  canEdit?: boolean;
  onUpdate?: (email: string, field: 'advance' | 'penalty', value: number) => void;
  onPercentageUpdate?: (email: string, percentage: string) => void;
}

const EmployeeCard = ({ employee, color, icon, canEdit = false, onUpdate, onPercentageUpdate }: EmployeeCardProps) => {
  const [advance, setAdvance] = useState(employee.advance);
  const [penalty, setPenalty] = useState(employee.penalty);
  const [percentage, setPercentage] = useState(employee.soloPercentage || '50');

  useEffect(() => {
    setAdvance(employee.advance);
    setPenalty(employee.penalty);
    setPercentage(employee.soloPercentage || '50');
  }, [employee.email, employee.advance, employee.penalty, employee.soloPercentage]);

  const handleBlur = (field: 'advance' | 'penalty', value: number) => {
    if (onUpdate && employee.email) {
      onUpdate(employee.email, field, value);
    }
  };

  const total = employee.sumRubles - advance - penalty;
  const colorClasses = {
    emerald: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30',
    amber: 'from-amber-500/20 to-yellow-500/20 border-amber-500/30',
    red: 'from-red-500/20 to-orange-500/20 border-red-500/30',
    purple: 'from-purple-500/20 to-violet-500/20 border-purple-500/30'
  };

  const iconClasses = {
    emerald: 'text-emerald-500',
    amber: 'text-amber-500',
    red: 'text-red-500',
    purple: 'text-purple-500'
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
        
        {employee.role === 'operator' && employee.operatorPercentage !== undefined && (
          <div className="flex justify-between items-center py-2 border-b bg-emerald-500/5 px-3 rounded">
            <span className="text-muted-foreground font-medium">Распределение</span>
            <span className="font-semibold text-sm">
              Оп: {employee.operatorPercentage}% | Пр: {employee.producerPercentage}%
            </span>
          </div>
        )}
        
        {!employee.role && color === 'amber' && (
          <div className="flex justify-between items-center py-2 border-b bg-amber-500/5 px-3 rounded">
            <span className="text-muted-foreground font-medium">Процент модели</span>
            <span className="font-semibold text-lg text-amber-600 dark:text-amber-400">
              30%
            </span>
          </div>
        )}
        
        {employee.role === 'solo_maker' && color === 'purple' && (
          <div className="flex justify-between items-center py-2 border-b bg-purple-500/5 px-3 rounded">
            <span className="text-muted-foreground font-medium">Процент соло-мейкера</span>
            <span className="font-semibold text-lg text-purple-600 dark:text-purple-400">
              {percentage}%
            </span>
          </div>
        )}
        
        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-muted-foreground">Сумма $</span>
          <span className="font-semibold text-lg">${employee.sumDollars.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-muted-foreground">Курс</span>
          <span className="font-semibold text-lg">{employee.rate.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between items-center py-3 px-4 bg-green-500/10 rounded-lg border border-green-500/20">
          <span className="font-medium">Сумма ₽</span>
          <span className="font-bold text-xl">{employee.sumRubles.toLocaleString()}₽</span>
        </div>
        
        <div className="flex justify-between items-center py-3 px-4 bg-red-500/10 rounded-lg border border-red-500/20">
          <span className="font-medium">Аванс</span>
          {canEdit ? (
            <Input
              type="number"
              value={advance}
              onChange={(e) => setAdvance(Number(e.target.value))}
              onBlur={(e) => handleBlur('advance', Number(e.target.value))}
              className="w-32 text-right font-bold text-xl text-red-600 dark:text-red-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          ) : (
            <span className="font-bold text-xl text-red-600 dark:text-red-400">{advance.toLocaleString()}₽</span>
          )}
        </div>
        
        <div className="flex justify-between items-center py-3 px-4 bg-red-500/10 rounded-lg border border-red-500/20">
          <span className="font-medium">Штраф</span>
          {canEdit ? (
            <Input
              type="number"
              value={penalty}
              onChange={(e) => setPenalty(Number(e.target.value))}
              onBlur={(e) => handleBlur('penalty', Number(e.target.value))}
              className="w-32 text-right font-bold text-xl text-red-600 dark:text-red-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          ) : (
            <span className="font-bold text-xl text-red-600 dark:text-red-400">{penalty.toLocaleString()}₽</span>
          )}
        </div>
        
        <div className="flex justify-between items-center py-4 px-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg border-2 border-green-500/40 mt-4">
          <span className="font-bold text-lg">Итог</span>
          <span className="font-bold text-2xl text-green-600 dark:text-green-400">{total.toLocaleString()}₽</span>
        </div>
      </div>
    </Card>
  );
};

export default EmployeeCard;