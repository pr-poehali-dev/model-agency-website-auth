import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { DayData } from './types';
import { calculateDailyIncome, formatDate } from './utils';

interface StatsCardsProps {
  onlineData: DayData[];
}

const StatsCards = ({ onlineData }: StatsCardsProps) => {
  if (!onlineData || onlineData.length === 0) {
    return null;
  }

  const totalIncome = onlineData.reduce((sum, d) => sum + calculateDailyIncome(d), 0);
  const totalShifts = onlineData.filter(d => d.isShift).length;
  const averageDaily = totalShifts > 0 ? totalIncome / totalShifts : 0;
  
  const bestDay = onlineData.reduce((best, current) => {
    const currentIncome = calculateDailyIncome(current);
    const bestIncome = calculateDailyIncome(best);
    return currentIncome > bestIncome ? current : best;
  }, onlineData[0]);
  
  const bestDayIncome = bestDay ? calculateDailyIncome(bestDay) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-muted-foreground">Всего за период</p>
          <Icon name="DollarSign" size={20} className="text-green-600" />
        </div>
        <p className="text-3xl font-bold text-green-600">${totalIncome.toFixed(2)}</p>
        <p className="text-xs text-muted-foreground mt-1">{totalShifts} смен</p>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-muted-foreground">Средний доход</p>
          <Icon name="TrendingUp" size={20} className="text-blue-600" />
        </div>
        <p className="text-3xl font-bold text-blue-600">${averageDaily.toFixed(2)}</p>
        <p className="text-xs text-muted-foreground mt-1">за смену</p>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-muted-foreground">Лучший день</p>
          <Icon name="Star" size={20} className="text-purple-600" />
        </div>
        <p className="text-3xl font-bold text-purple-600">${bestDayIncome.toFixed(2)}</p>
        <p className="text-xs text-muted-foreground mt-1">{bestDay ? formatDate(bestDay.date) : '-'}</p>
      </Card>
    </div>
  );
};

export default StatsCards;