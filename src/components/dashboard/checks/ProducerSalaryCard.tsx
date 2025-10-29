import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { ProducerData } from './types';
import { Period } from '@/utils/periodUtils';

interface ProducerSalaryCardProps {
  producerData: ProducerData;
  period: Period;
}

const ProducerSalaryCard = ({ producerData, period }: ProducerSalaryCardProps) => {
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
          <span className="font-bold text-xl text-yellow-600 dark:text-yellow-400">{producerData.expenses.toLocaleString()}₽</span>
        </div>
        
        <div className="flex justify-between items-center py-3 px-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
          <span className="font-medium">Аванс</span>
          <span className="font-bold text-xl text-yellow-600 dark:text-yellow-400">{producerData.advance.toLocaleString()}₽</span>
        </div>
        
        <div className="flex justify-between items-center py-3 px-4 bg-red-500/10 rounded-lg border border-red-500/20">
          <span className="font-medium">Штраф</span>
          <span className="font-bold text-xl text-red-600 dark:text-red-400">{producerData.penalty.toLocaleString()}₽</span>
        </div>
        
        <div className="flex justify-between items-center py-4 px-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg border-2 border-green-500/40 mt-4">
          <span className="font-bold text-lg">Итог</span>
          <span className="font-bold text-2xl text-green-600 dark:text-green-400">{producerData.total.toLocaleString()}₽</span>
        </div>
      </div>
    </Card>
  );
};

export default ProducerSalaryCard;