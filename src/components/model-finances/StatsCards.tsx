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
      <Card className="relative overflow-hidden p-6 group">
        <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-green-500/25 blur-3xl opacity-60 group-hover:opacity-90 transition-opacity" />
        <div className="relative flex items-center justify-between mb-2">
          <p className="text-sm text-muted-foreground">Всего за период</p>
          <div className="p-2 rounded-xl bg-green-500/15 border border-green-500/30">
            <Icon name="DollarSign" size={18} className="text-green-400" />
          </div>
        </div>
        <p className="relative text-3xl font-display font-bold text-green-400">${totalIncome.toFixed(2)}</p>
        <p className="relative text-xs text-muted-foreground mt-1">{totalShifts} смен</p>
      </Card>

      <Card className="relative overflow-hidden p-6 group">
        <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-emerald-500/25 blur-3xl opacity-60 group-hover:opacity-90 transition-opacity" />
        <div className="relative flex items-center justify-between mb-2">
          <p className="text-sm text-muted-foreground">Средний доход</p>
          <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30">
            <Icon name="TrendingUp" size={18} className="text-emerald-400" />
          </div>
        </div>
        <p className="relative text-3xl font-display font-bold text-emerald-400">${averageDaily.toFixed(2)}</p>
        <p className="relative text-xs text-muted-foreground mt-1">за смену</p>
      </Card>

      <Card className="relative overflow-hidden p-6 group">
        <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-amber-500/25 blur-3xl opacity-60 group-hover:opacity-90 transition-opacity" />
        <div className="relative flex items-center justify-between mb-2">
          <p className="text-sm text-muted-foreground">Лучший день</p>
          <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30">
            <Icon name="Star" size={18} className="text-amber-400" />
          </div>
        </div>
        <p className="relative text-3xl font-display font-bold text-amber-400">${bestDayIncome.toFixed(2)}</p>
        <p className="relative text-xs text-muted-foreground mt-1">{bestDay ? formatDate(bestDay.date) : '-'}</p>
      </Card>
    </div>
  );
};

export default StatsCards;