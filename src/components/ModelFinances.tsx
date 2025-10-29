import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Icon from '@/components/ui/icon';

interface ModelFinancesProps {
  modelId: number;
  modelName: string;
  onBack?: () => void;
}

const generateModelData = (modelId: number) => {
  const baseMultiplier = modelId * 0.8;
  
  return {
    daily: [
      { date: '16.10', cb: Math.floor(41 * baseMultiplier), sp: Math.floor(106 * baseMultiplier), cbIncome: 44.01 * baseMultiplier, spIncome: 0 },
      { date: '17.10', cb: Math.floor(38 * baseMultiplier), sp: Math.floor(79 * baseMultiplier), cbIncome: 1.62 * baseMultiplier, spIncome: 0 },
      { date: '18.10', cb: Math.floor(49 * baseMultiplier), sp: Math.floor(108 * baseMultiplier), cbIncome: 67.59 * baseMultiplier, spIncome: 0 },
      { date: '19.10', cb: Math.floor(46 * baseMultiplier), sp: Math.floor(119 * baseMultiplier), cbIncome: 38.61 * baseMultiplier, spIncome: 525 * baseMultiplier },
      { date: '20.10', cb: Math.floor(39 * baseMultiplier), sp: Math.floor(103 * baseMultiplier), cbIncome: 2.67 * baseMultiplier, spIncome: 0 },
      { date: '21.10', cb: Math.floor(26 * baseMultiplier), sp: Math.floor(98 * baseMultiplier), cbIncome: 0.06 * baseMultiplier, spIncome: 0 },
      { date: '22.10', cb: Math.floor(31 * baseMultiplier), sp: Math.floor(69 * baseMultiplier), cbIncome: 3.00 * baseMultiplier, spIncome: 0 },
      { date: '23.10', cb: Math.floor(100 * baseMultiplier), sp: Math.floor(81 * baseMultiplier), cbIncome: 18.84 * baseMultiplier, spIncome: 0 },
      { date: '24.10', cb: Math.floor(30 * baseMultiplier), sp: Math.floor(78 * baseMultiplier), cbIncome: 8.37 * baseMultiplier, spIncome: 515.58 * baseMultiplier },
      { date: '27.10', cb: Math.floor(34 * baseMultiplier), sp: Math.floor(77 * baseMultiplier), cbIncome: 15.30 * baseMultiplier, spIncome: 97.53 * baseMultiplier },
    ],
    summary: {
      cbTokens: Math.floor(1467 * baseMultiplier),
      cbIncome: 200.07 * baseMultiplier,
      spTokens: Math.floor(37137 * baseMultiplier),
      spIncome: 1138.11 * baseMultiplier,
      totalIncome: (200.07 + 1138.11) * baseMultiplier,
    }
  };
};

const ModelFinances = ({ modelId, modelName, onBack }: ModelFinancesProps) => {
  const data = generateModelData(modelId);
  
  const graphData = data.daily.map(d => ({
    date: d.date,
    onlineSP: d.sp,
    onlineCB: d.cb,
  }));

  const incomeData = data.daily.map(d => ({
    date: d.date,
    CB: d.cbIncome,
    SP: d.spIncome,
  }));

  const platformSummary = [
    { platform: 'Chaturbate', tokens: data.summary.cbTokens, income: data.summary.cbIncome },
    { platform: 'Stripchat', tokens: data.summary.spTokens, income: data.summary.spIncome },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="outline" size="icon" onClick={onBack}>
              <Icon name="ArrowLeft" size={20} />
            </Button>
          )}
          <div>
            <h2 className="text-3xl font-serif font-bold text-foreground mb-2">
              Финансы — {modelName}
            </h2>
            <p className="text-muted-foreground">Статистика доходов по платформам</p>
          </div>
        </div>
        <Badge variant="default" className="text-lg px-4 py-2">
          <Icon name="DollarSign" size={18} className="mr-1" />
          ${data.summary.totalIncome.toFixed(2)}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {platformSummary.map((platform) => (
          <Card key={platform.platform} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{platform.platform}</h3>
              <Badge variant="outline">{platform.tokens} токенов</Badge>
            </div>
            <div className="text-3xl font-bold text-primary">
              ${platform.income.toFixed(2)}
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Онлайн по платформам</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={graphData}>
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
            <Line type="monotone" dataKey="onlineSP" stroke="#ef4444" name="Stripchat" strokeWidth={2} />
            <Line type="monotone" dataKey="onlineCB" stroke="#f97316" name="Chaturbate" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Доходы по дням</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={incomeData}>
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
            <Bar dataKey="CB" fill="#f97316" name="Chaturbate ($)" />
            <Bar dataKey="SP" fill="#ef4444" name="Stripchat ($)" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="p-3 text-left font-semibold text-foreground">Платформа</th>
                {data.daily.map((d) => (
                  <th key={d.date} className="p-3 text-center font-medium text-foreground whitespace-nowrap">
                    {d.date}
                  </th>
                ))}
                <th className="p-3 text-center font-semibold text-foreground bg-primary/20">
                  Итого
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border hover:bg-muted/30">
                <td className="p-3 font-medium text-foreground">Online CB</td>
                {data.daily.map((d) => (
                  <td key={d.date} className="p-3 text-center text-muted-foreground">
                    {d.cb || '—'}
                  </td>
                ))}
                <td className="p-3 text-center font-semibold bg-primary/20">
                  {data.summary.cbTokens}
                </td>
              </tr>

              <tr className="border-b border-border bg-orange-900/20">
                <td className="p-3 font-medium text-foreground">Chaturbate ($)</td>
                {data.daily.map((d) => (
                  <td key={d.date} className="p-3 text-center text-muted-foreground">
                    {d.cbIncome > 0 ? `$${d.cbIncome.toFixed(2)}` : '—'}
                  </td>
                ))}
                <td className="p-3 text-center font-semibold bg-primary/30">
                  ${data.summary.cbIncome.toFixed(2)}
                </td>
              </tr>

              <tr className="border-b border-border hover:bg-muted/30">
                <td className="p-3 font-medium text-foreground">Online SP</td>
                {data.daily.map((d) => (
                  <td key={d.date} className="p-3 text-center text-muted-foreground">
                    {d.sp || '—'}
                  </td>
                ))}
                <td className="p-3 text-center font-semibold bg-primary/20">
                  {data.summary.spTokens}
                </td>
              </tr>

              <tr className="border-b border-border bg-red-900/20">
                <td className="p-3 font-medium text-foreground">Stripchat ($)</td>
                {data.daily.map((d) => (
                  <td key={d.date} className="p-3 text-center text-muted-foreground">
                    {d.spIncome > 0 ? `$${d.spIncome.toFixed(2)}` : '—'}
                  </td>
                ))}
                <td className="p-3 text-center font-semibold bg-primary/30">
                  ${data.summary.spIncome.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default ModelFinances;