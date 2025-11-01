import { Card } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DayData } from './types';
import { formatDate, calculatePlatformSummary, calculateDailyIncome } from './utils';

interface ChartsProps {
  onlineData: DayData[];
}

const Charts = ({ onlineData }: ChartsProps) => {
  if (!onlineData || onlineData.length === 0) {
    return null;
  }

  const graphIncomeData = onlineData.map(d => ({
    date: formatDate(d.date),
    income: calculateDailyIncome(d),
  }));

  const platformSummary = calculatePlatformSummary(onlineData);

  return (
    <>
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Доход по дням ($)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={graphIncomeData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="date" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip />
            <Bar dataKey="income" fill="hsl(var(--primary))" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Доход по платформам</h3>
        <div className="space-y-3">
          {platformSummary.map(({ platform, amount }) => (
            <div key={platform} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <span className="font-medium">{platform}</span>
              <div className="text-right">
                <p className="font-semibold text-lg">${amount.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
};

export default Charts;