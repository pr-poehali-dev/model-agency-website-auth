import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { ProducerData } from './types';
import { Period } from '@/utils/periodUtils';
import { useState, useEffect } from 'react';

interface ProducerSalaryCardProps {
  producerData: ProducerData;
  period: Period;
  canEdit?: boolean;
  onUpdate?: (email: string, field: 'expenses' | 'advance' | 'penalty', value: number) => void;
}

const ProducerSalaryCard = ({ producerData, period, canEdit = false, onUpdate }: ProducerSalaryCardProps) => {
  const [expenses, setExpenses] = useState(producerData.expenses);
  const [advance, setAdvance] = useState(producerData.advance);
  const [penalty, setPenalty] = useState(producerData.penalty);

  useEffect(() => {
    setExpenses(producerData.expenses);
    setAdvance(producerData.advance);
    setPenalty(producerData.penalty);
  }, [producerData.expenses, producerData.advance, producerData.penalty]);

  const handleBlur = (field: 'expenses' | 'advance' | 'penalty', value: number) => {
    if (onUpdate && producerData.email) {
      onUpdate(producerData.email, field, value);
    }
  };

  const total = producerData.sumRubles + expenses - advance - penalty;
  return (
    <Card className="overflow-hidden max-w-2xl mx-auto border-2 border-red-500/30 shadow-lg">
      <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 p-4 text-center border-b-2 border-red-500/30">
        <div className="flex items-center justify-center gap-3">
          <Icon name="Crown" size={28} className="text-red-500" />
          <h3 className="text-2xl font-serif font-bold">{producerData.name}</h3>
          <Icon name="Crown" size={28} className="text-red-500" />
        </div>
        <div className="text-sm text-muted-foreground mt-1">Период: {period.label}</div>
      </div>
      
      <div className="p-6 space-y-3">
        {producerData.averageProducerPercentage !== undefined && (
          <div className="flex justify-between items-center py-2 border-b bg-red-500/5 px-3 rounded">
            <span className="text-muted-foreground font-medium">Средний процент</span>
            <span className="font-semibold text-lg text-red-600 dark:text-red-400">
              {producerData.averageProducerPercentage}%
            </span>
          </div>
        )}
        
        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-muted-foreground">Сумма $</span>
          <span className="font-semibold text-lg">${producerData.sumDollars.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between items-center py-2 border-b">
          <span className="text-muted-foreground">Курс</span>
          <span className="font-semibold text-lg">{producerData.rate}</span>
        </div>
        
        <div className="flex justify-between items-center py-3 px-4 bg-green-500/10 rounded-lg border border-green-500/20">
          <span className="font-medium">Сумма ₽</span>
          <span className="font-bold text-xl">{producerData.sumRubles.toLocaleString()}₽</span>
        </div>
        
        <div className="flex justify-between items-center py-3 px-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
          <span className="font-medium">Затраты</span>
          {canEdit ? (
            <Input
              type="number"
              value={expenses}
              onChange={(e) => setExpenses(Number(e.target.value))}
              onBlur={(e) => handleBlur('expenses', Number(e.target.value))}
              className="w-32 text-right font-bold text-xl text-yellow-600 dark:text-yellow-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          ) : (
            <span className="font-bold text-xl text-yellow-600 dark:text-yellow-400">{expenses.toLocaleString()}₽</span>
          )}
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

export default ProducerSalaryCard;