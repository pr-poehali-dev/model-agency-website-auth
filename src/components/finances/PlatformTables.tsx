import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Period } from '@/utils/periodUtils';

interface PlatformTablesProps {
  period?: Period;
}

const PlatformTables = ({ period }: PlatformTablesProps) => {
  const [onlineData, setOnlineData] = useState<any[]>([]);
  const [platformSummary, setPlatformSummary] = useState<any[]>([]);
  const [graphOnlineData, setGraphOnlineData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!period) return;

    const loadFinances = async () => {
      setIsLoading(true);
      try {
        const formatDate = (date: Date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };

        const periodStart = formatDate(period.startDate);
        const periodEnd = formatDate(period.endDate);

        const response = await fetch(
          `https://functions.poehali.dev/003274b3-54d7-44d9-8411-b37a5048c3c9?period_start=${periodStart}&period_end=${periodEnd}`
        );

        if (response.ok) {
          const data = await response.json();
          setOnlineData(data.dailyData || []);
          setPlatformSummary(data.platformSummary || []);
          setGraphOnlineData(data.graphOnlineData || []);
        }
      } catch (error) {
        console.error('Failed to load finances:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFinances();
  }, [period]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Icon name="Loader2" size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* График онлайна */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Icon name="Activity" size={20} className="text-primary" />
          Онлайн по платформам
        </h3>
        {graphOnlineData.length === 0 ? (
          <div className="flex justify-center items-center h-[300px] text-muted-foreground">
            Нет данных за выбранный период
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={graphOnlineData}>
            <defs>
              <linearGradient id="colorOnlineSP" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorOnlineCB" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="date" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Area type="monotone" dataKey="onlineSP" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorOnlineSP)" name="Stripchat" />
            <Area type="monotone" dataKey="onlineCB" stroke="#f97316" fillOpacity={1} fill="url(#colorOnlineCB)" name="Chaturbate" />
          </AreaChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Таблицы по платформам */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Сводка по платформам */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Icon name="BarChart3" size={20} className="text-accent" />
            Сводка по платформам
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 font-semibold">Платформа</th>
                  <th className="text-right py-3 px-2 font-semibold">Токены</th>
                  <th className="text-right py-3 px-2 font-semibold">Доход ($)</th>
                </tr>
              </thead>
              <tbody>
                {platformSummary.map((platform, index) => (
                  <tr key={index} className="border-b border-border/50 hover:bg-muted/50">
                    <td className="py-3 px-2 font-medium">{platform.platform}</td>
                    <td className="py-3 px-2 text-right text-muted-foreground">{platform.tokens.toLocaleString()}</td>
                    <td className="py-3 px-2 text-right font-semibold text-primary">${platform.income.toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="font-bold bg-muted/30">
                  <td className="py-3 px-2">Итого</td>
                  <td className="py-3 px-2 text-right">
                    {platformSummary.reduce((sum, p) => sum + p.tokens, 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-2 text-right text-primary">
                    ${platformSummary.reduce((sum, p) => sum + p.income, 0).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Детальная статистика */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Icon name="Calendar" size={20} className="text-primary" />
            Ежедневная статистика
          </h3>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 font-semibold">Дата</th>
                  <th className="text-right py-2 px-2 font-semibold">CB</th>
                  <th className="text-right py-2 px-2 font-semibold">SP</th>
                  <th className="text-right py-2 px-2 font-semibold">Доход ($)</th>
                </tr>
              </thead>
              <tbody>
                {onlineData.map((day, index) => {
                  const totalIncome = day.cbIncome + day.spIncome + day.sodaIncome + day.cam4Income;
                  return (
                    <tr key={index} className="border-b border-border/50 hover:bg-muted/50">
                      <td className="py-2 px-2 font-medium">{day.date}</td>
                      <td className="py-2 px-2 text-right text-muted-foreground">{day.cb}</td>
                      <td className="py-2 px-2 text-right text-muted-foreground">{day.sp}</td>
                      <td className="py-2 px-2 text-right font-semibold text-primary">${totalIncome.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PlatformTables;