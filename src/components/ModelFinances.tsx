import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Icon from '@/components/ui/icon';

interface ModelFinancesProps {
  modelId: number;
  modelName: string;
  onBack?: () => void;
}

interface DayData {
  date: string;
  cb: number;
  sp: number;
  soda: number;
  cam4: number;
  cbIncome: number;
  spIncome: number;
  sodaIncome: number;
  cam4Income: number;
  stripchatTokens: number;
  operator: string;
  shift: boolean;
}

const generateInitialData = (modelId: number): DayData[] => {
  const baseMultiplier = modelId * 0.8;
  
  return [
    { date: '16.10', cb: Math.floor(41 * baseMultiplier), sp: Math.floor(106 * baseMultiplier), soda: 0, cam4: 0, cbIncome: 44.01 * baseMultiplier, spIncome: 0, sodaIncome: 0, cam4Income: 0, stripchatTokens: 0, operator: 'Женя', shift: true },
    { date: '17.10', cb: Math.floor(38 * baseMultiplier), sp: Math.floor(79 * baseMultiplier), soda: 0, cam4: 0, cbIncome: 1.62 * baseMultiplier, spIncome: 0, sodaIncome: 0, cam4Income: 0, stripchatTokens: 0, operator: 'Женя', shift: true },
    { date: '18.10', cb: Math.floor(49 * baseMultiplier), sp: Math.floor(108 * baseMultiplier), soda: 0, cam4: 0, cbIncome: 67.59 * baseMultiplier, spIncome: 0, sodaIncome: 0, cam4Income: 0, stripchatTokens: 0, operator: 'Женя', shift: true },
    { date: '19.10', cb: Math.floor(46 * baseMultiplier), sp: Math.floor(119 * baseMultiplier), soda: 0, cam4: 0, cbIncome: 38.61 * baseMultiplier, spIncome: 525 * baseMultiplier, sodaIncome: 0, cam4Income: 0, stripchatTokens: Math.floor(17500 * baseMultiplier), operator: 'Женя', shift: true },
    { date: '20.10', cb: Math.floor(39 * baseMultiplier), sp: Math.floor(103 * baseMultiplier), soda: 0, cam4: 0, cbIncome: 2.67 * baseMultiplier, spIncome: 0, sodaIncome: 0, cam4Income: 0, stripchatTokens: 0, operator: 'Женя', shift: true },
    { date: '21.10', cb: Math.floor(26 * baseMultiplier), sp: Math.floor(98 * baseMultiplier), soda: 0, cam4: 0, cbIncome: 0.06 * baseMultiplier, spIncome: 0, sodaIncome: 0, cam4Income: 0, stripchatTokens: 0, operator: 'Женя', shift: true },
    { date: '22.10', cb: Math.floor(31 * baseMultiplier), sp: Math.floor(69 * baseMultiplier), soda: 0, cam4: 0, cbIncome: 3.00 * baseMultiplier, spIncome: 0, sodaIncome: 0, cam4Income: 0, stripchatTokens: 0, operator: 'Женя', shift: true },
    { date: '23.10', cb: Math.floor(100 * baseMultiplier), sp: Math.floor(81 * baseMultiplier), soda: 0, cam4: 0.2 * baseMultiplier, cbIncome: 18.84 * baseMultiplier, spIncome: 0, sodaIncome: 0, cam4Income: 0.12 * baseMultiplier, stripchatTokens: 0, operator: 'Женя', shift: true },
    { date: '24.10', cb: Math.floor(30 * baseMultiplier), sp: Math.floor(78 * baseMultiplier), soda: 0, cam4: 0.4 * baseMultiplier, cbIncome: 8.37 * baseMultiplier, spIncome: 515.58 * baseMultiplier, sodaIncome: 0, cam4Income: 0.24 * baseMultiplier, stripchatTokens: Math.floor(17186 * baseMultiplier), operator: 'Женя', shift: true },
    { date: '25.10', cb: 0, sp: 0, soda: 0, cam4: 0, cbIncome: 0, spIncome: 0, sodaIncome: 0, cam4Income: 0, stripchatTokens: 0, operator: 'Женя', shift: false },
    { date: '26.10', cb: 0, sp: 0, soda: 0, cam4: 0, cbIncome: 0, spIncome: 0, sodaIncome: 0, cam4Income: 0, stripchatTokens: 0, operator: '', shift: false },
    { date: '27.10', cb: Math.floor(34 * baseMultiplier), sp: Math.floor(77 * baseMultiplier), soda: 0, cam4: 0, cbIncome: 15.30 * baseMultiplier, spIncome: 97.53 * baseMultiplier, sodaIncome: 0, cam4Income: 0, stripchatTokens: Math.floor(3251 * baseMultiplier), operator: '', shift: false },
  ];
};

const ModelFinances = ({ modelId, modelName, onBack }: ModelFinancesProps) => {
  const [onlineData, setOnlineData] = useState<DayData[]>(generateInitialData(modelId));
  
  const handleCellChange = (index: number, field: keyof DayData, value: string | number | boolean) => {
    const newData = [...onlineData];
    newData[index] = { ...newData[index], [field]: value };
    setOnlineData(newData);
  };

  const totalCbTokens = onlineData.reduce((sum, d) => sum + d.cb, 0);
  const totalSpTokens = onlineData.reduce((sum, d) => sum + d.stripchatTokens, 0);
  const totalChaturbateTokens = Math.floor(totalCbTokens * 0.456);
  const totalIncome = onlineData.reduce((sum, d) => sum + d.cbIncome + d.spIncome + d.sodaIncome + d.cam4Income, 0);
  const totalShifts = onlineData.filter(d => d.shift).length;

  const graphOnlineData = onlineData.map(d => ({
    date: d.date,
    onlineSP: d.sp,
    onlineCB: d.cb,
  }));

  const platformSummary = [
    { platform: 'Chaturbate', tokens: totalCbTokens, income: onlineData.reduce((sum, d) => sum + d.cbIncome, 0) },
    { platform: 'Stripchat', tokens: totalSpTokens, income: onlineData.reduce((sum, d) => sum + d.spIncome, 0) },
    { platform: 'CamSoda', tokens: 0, income: 0 },
    { platform: 'Cam4', tokens: onlineData.reduce((sum, d) => sum + d.cam4, 0), income: onlineData.reduce((sum, d) => sum + d.cam4Income, 0) },
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
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="p-3 text-left font-semibold text-foreground">Настоящий период</th>
                {onlineData.map((d) => (
                  <th key={d.date} className="p-3 text-center font-medium text-foreground whitespace-nowrap">
                    {d.date}
                  </th>
                ))}
                <th className="p-3 text-center font-semibold text-foreground dark:bg-yellow-900/30 bg-slate-700">
                  Tokens
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border hover:bg-muted/30">
                <td className="p-3 font-medium text-foreground">Online CB</td>
                {onlineData.map((d, idx) => (
                  <td key={d.date} className="p-2 text-center">
                    <Input 
                      type="number"
                      value={d.cb || ''}
                      onChange={(e) => handleCellChange(idx, 'cb', Number(e.target.value))}
                      className="w-16 h-8 text-center text-xs"
                    />
                  </td>
                ))}
                <td className="p-3 text-center font-semibold dark:bg-yellow-900/30 bg-slate-800">{totalCbTokens}</td>
              </tr>

              <tr className="border-b border-border dark:bg-orange-900/20 bg-orange-900/30">
                <td className="p-3 font-medium text-foreground">Chaturbate</td>
                {onlineData.map((d, idx) => (
                  <td key={d.date} className="p-2 text-center">
                    <Input 
                      type="number"
                      value={d.cb || ''}
                      onChange={(e) => handleCellChange(idx, 'cb', Number(e.target.value))}
                      className="w-16 h-8 text-center text-xs"
                    />
                  </td>
                ))}
                <td className="p-3 text-center font-semibold dark:bg-yellow-900/50 bg-yellow-800/50">{totalChaturbateTokens}</td>
              </tr>

              <tr className="border-b border-border hover:bg-muted/30">
                <td className="p-3 font-medium text-foreground">Online SP</td>
                {onlineData.map((d, idx) => (
                  <td key={d.date} className="p-2 text-center">
                    <Input 
                      type="number"
                      value={d.sp || ''}
                      onChange={(e) => handleCellChange(idx, 'sp', Number(e.target.value))}
                      className="w-16 h-8 text-center text-xs"
                    />
                  </td>
                ))}
                <td className="p-3 text-center font-semibold dark:bg-yellow-900/50 bg-yellow-800/50">Tokens</td>
              </tr>

              <tr className="border-b border-border dark:bg-red-900/20 bg-red-900/30">
                <td className="p-3 font-medium text-foreground">Stripchat</td>
                {onlineData.map((d, idx) => (
                  <td key={d.date} className="p-2 text-center">
                    <Input 
                      type="number"
                      value={d.stripchatTokens || ''}
                      onChange={(e) => handleCellChange(idx, 'stripchatTokens', Number(e.target.value))}
                      className="w-16 h-8 text-center text-xs"
                    />
                  </td>
                ))}
                <td className="p-3 text-center font-semibold dark:bg-yellow-900/50 bg-yellow-800/50">{totalSpTokens}</td>
              </tr>

              <tr className="border-b border-border hover:bg-muted/30">
                <td className="p-3 font-medium text-foreground">Online Soda</td>
                {onlineData.map((d, idx) => (
                  <td key={d.date} className="p-2 text-center">
                    <Input 
                      type="number"
                      value={d.soda || ''}
                      onChange={(e) => handleCellChange(idx, 'soda', Number(e.target.value))}
                      className="w-16 h-8 text-center text-xs"
                    />
                  </td>
                ))}
                <td className="p-3 text-center font-semibold dark:bg-yellow-900/50 bg-yellow-800/50">Tokens</td>
              </tr>

              <tr className="border-b border-border dark:bg-blue-900/20 bg-blue-900/30">
                <td className="p-3 font-medium text-foreground">CamSoda</td>
                {onlineData.map((d, idx) => (
                  <td key={d.date} className="p-2 text-center">
                    <Input 
                      type="number"
                      value={d.sodaIncome || ''}
                      onChange={(e) => handleCellChange(idx, 'sodaIncome', Number(e.target.value))}
                      className="w-16 h-8 text-center text-xs"
                    />
                  </td>
                ))}
                <td className="p-3 text-center font-semibold dark:bg-yellow-900/50 bg-yellow-800/50">0</td>
              </tr>

              <tr className="border-b border-border dark:bg-orange-900/20 bg-orange-900/30">
                <td className="p-3 font-medium text-foreground">Cam4</td>
                {onlineData.map((d, idx) => (
                  <td key={d.date} className="p-2 text-center">
                    <Input 
                      type="number"
                      step="0.1"
                      value={d.cam4 || ''}
                      onChange={(e) => handleCellChange(idx, 'cam4', Number(e.target.value))}
                      className="w-16 h-8 text-center text-xs"
                    />
                  </td>
                ))}
                <td className="p-3 text-center font-semibold dark:bg-yellow-900/50 bg-yellow-800/50">
                  {platformSummary[3].tokens.toFixed(1)}
                </td>
              </tr>

              <tr className="border-b border-border dark:bg-teal-900/20 bg-teal-900/30">
                <td className="p-3 font-medium text-foreground">Переводы</td>
                {onlineData.map((d) => (
                  <td key={d.date} className="p-3 text-center text-muted-foreground"></td>
                ))}
                <td className="p-3 text-center font-semibold dark:bg-yellow-900/50 bg-yellow-800/50">0</td>
              </tr>

              <tr className="border-b border-border hover:bg-muted/30">
                <td className="p-3 font-medium text-foreground">Оператор (Имя)</td>
                {onlineData.map((d, idx) => (
                  <td key={d.date} className="p-2 text-center">
                    <Input 
                      type="text"
                      value={d.operator}
                      onChange={(e) => handleCellChange(idx, 'operator', e.target.value)}
                      className="w-20 h-8 text-center text-xs"
                      placeholder="Имя"
                    />
                  </td>
                ))}
                <td className="p-3 text-center font-semibold dark:bg-yellow-900/50 bg-yellow-800/50"></td>
              </tr>

              <tr className="border-b border-border hover:bg-muted/30">
                <td className="p-3 font-medium text-foreground">Смены</td>
                {onlineData.map((d, idx) => (
                  <td key={d.date} className="p-3 text-center">
                    <Checkbox 
                      checked={d.shift}
                      onCheckedChange={(checked) => handleCellChange(idx, 'shift', checked === true)}
                    />
                  </td>
                ))}
                <td className="p-3 text-center font-semibold dark:bg-yellow-900/50 bg-yellow-800/50">{totalShifts}</td>
              </tr>

              <tr className="border-b-2 border-border bg-muted/50 font-semibold">
                <td className="p-3 text-foreground">Income</td>
                {onlineData.map((d) => {
                  const total = d.cbIncome + d.spIncome + d.sodaIncome + d.cam4Income;
                  return (
                    <td key={d.date} className="p-3 text-center text-foreground">
                      ${total.toFixed(2)}
                    </td>
                  );
                })}
                <td className="p-3 text-center font-bold text-green-600 dark:text-green-400 bg-yellow-100 dark:bg-yellow-900/30">
                  ${totalIncome.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {platformSummary.map((platform) => (
          <Card key={platform.platform} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{platform.platform}</h3>
              <Badge variant="outline">{platform.tokens.toFixed(platform.platform === 'Cam4' ? 1 : 0)} токенов</Badge>
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
          <LineChart data={graphOnlineData}>
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
          <BarChart data={onlineData.map(d => ({ date: d.date, CB: d.cbIncome, SP: d.spIncome }))}>
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
    </div>
  );
};

export default ModelFinances;
