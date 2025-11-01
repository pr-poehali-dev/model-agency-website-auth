import { Card } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DayData } from './types';
import { formatDate, calculatePlatformSummary, calculateDailyIncome } from './utils';

interface ChartsProps {
  onlineData: DayData[];
}

const Charts = ({ onlineData }: ChartsProps) => {
  const graphOnlineData = onlineData.map(d => ({
    date: formatDate(d.date),
    onlineSP: d.sp,
    onlineCB: d.cb,
    onlineSoda: d.soda,
  }));

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
        <h3 className="font-semibold mb-4">Онлайн по платформам (минуты)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={graphOnlineData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="date" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="onlineCB" stroke="#f97316" name="CB" strokeWidth={2} />
            <Line type="monotone" dataKey="onlineSP" stroke="#3b82f6" name="SP" strokeWidth={2} />
            <Line type="monotone" dataKey="onlineSoda" stroke="#8b5cf6" name="Soda" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Доход по платформам</h3>
        <div className="space-y-3">
          {platformSummary.map(({ platform, tokens, income }) => (
            <div key={platform} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <span className="font-medium">{platform}</span>
              <div className="text-right">
                <p className="font-semibold text-lg">${income.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">{tokens.toFixed(0)} $</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
};

export default Charts;
