import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Period, getDatesInPeriod } from '@/utils/periodUtils';

const onlineData = [
  { date: '16.10', cb: 41, sp: 106, soda: 0, cam4: 0, cbIncome: 44.01, spIncome: 0, sodaIncome: 0, cam4Income: 0 },
  { date: '17.10', cb: 38, sp: 79, soda: 0, cam4: 0, cbIncome: 1.62, spIncome: 0, sodaIncome: 0, cam4Income: 0 },
  { date: '18.10', cb: 49, sp: 108, soda: 0, cam4: 0, cbIncome: 67.59, spIncome: 0, sodaIncome: 0, cam4Income: 0 },
  { date: '19.10', cb: 46, sp: 119, soda: 0, cam4: 0, cbIncome: 38.61, spIncome: 525, sodaIncome: 0, cam4Income: 0 },
  { date: '20.10', cb: 39, sp: 103, soda: 0, cam4: 0, cbIncome: 2.67, spIncome: 0, sodaIncome: 0, cam4Income: 0 },
  { date: '21.10', cb: 26, sp: 98, soda: 0, cam4: 0, cbIncome: 0.06, spIncome: 0, sodaIncome: 0, cam4Income: 0 },
  { date: '22.10', cb: 31, sp: 69, soda: 0, cam4: 0, cbIncome: 3.00, spIncome: 0, sodaIncome: 0, cam4Income: 0 },
  { date: '23.10', cb: 100, sp: 81, soda: 0, cam4: 0.2, cbIncome: 18.84, spIncome: 0, sodaIncome: 0, cam4Income: 0.12 },
  { date: '24.10', cb: 30, sp: 78, soda: 0, cam4: 0.4, cbIncome: 8.37, spIncome: 515.58, sodaIncome: 0, cam4Income: 0.24 },
  { date: '25.10', cb: 0, sp: 0, soda: 0, cam4: 0, cbIncome: 0, spIncome: 0, sodaIncome: 0, cam4Income: 0 },
  { date: '26.10', cb: 0, sp: 0, soda: 0, cam4: 0, cbIncome: 0, spIncome: 0, sodaIncome: 0, cam4Income: 0 },
  { date: '27.10', cb: 34, sp: 77, soda: 0, cam4: 0, cbIncome: 15.30, spIncome: 97.53, sodaIncome: 0, cam4Income: 0 },
];

const platformSummary = [
  { platform: 'Chaturbate', tokens: 1467, income: 200.07 },
  { platform: 'Stripchat', tokens: 37137, income: 1138.11 },
  { platform: 'CamSoda', tokens: 0, income: 0 },
];

const graphOnlineData = [
  { date: '16.10', onlineSP: 106, onlineCB: 41 },
  { date: '17.10', onlineSP: 79, onlineCB: 38 },
  { date: '18.10', onlineSP: 108, onlineCB: 49 },
  { date: '19.10', onlineSP: 119, onlineCB: 46 },
  { date: '20.10', onlineSP: 103, onlineCB: 39 },
  { date: '21.10', onlineSP: 98, onlineCB: 26 },
  { date: '22.10', onlineSP: 69, onlineCB: 31 },
  { date: '23.10', onlineSP: 81, onlineCB: 100 },
  { date: '24.10', onlineSP: 78, onlineCB: 30 },
  { date: '27.10', onlineSP: 77, onlineCB: 34 },
];

interface PlatformTablesProps {
  period?: Period;
}

const PlatformTables = ({ period }: PlatformTablesProps) => {
  return (
    <div className="space-y-6">
      {/* График онлайна */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Icon name="Activity" size={20} className="text-primary" />
          Онлайн по платформам
        </h3>
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