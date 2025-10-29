import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Icon from '@/components/ui/icon';
import { getCurrentPeriod, getDatesInPeriod } from '@/utils/periodUtils';

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
  transfers: number;
  operator: string;
  shift: boolean;
}

const generateInitialData = (): DayData[] => {
  const period = getCurrentPeriod();
  const dates = getDatesInPeriod(period);
  
  return dates.map(date => ({
    date,
    cb: 0,
    sp: 0,
    soda: 0,
    cam4: 0,
    cbIncome: 0,
    spIncome: 0,
    sodaIncome: 0,
    cam4Income: 0,
    stripchatTokens: 0,
    transfers: 0,
    operator: '',
    shift: false
  }));
};

const API_URL = 'https://functions.poehali.dev/99ec6654-50ec-4d09-8bfc-cdc60c8fec1e';

const ModelFinances = ({ modelId, modelName, onBack }: ModelFinancesProps) => {
  const [onlineData, setOnlineData] = useState<DayData[]>(generateInitialData());
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadFinancialData();
  }, [modelId]);

  const loadFinancialData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}?modelId=${modelId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          setOnlineData(data);
        }
      }
    } catch (error) {
      console.error('Failed to load financial data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCellChange = (index: number, field: keyof DayData, value: string | number | boolean) => {
    const newData = [...onlineData];
    newData[index] = { ...newData[index], [field]: value };
    setOnlineData(newData);
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          modelId,
          data: onlineData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save data');
      }

      const result = await response.json();
      
      toast({
        title: 'Данные сохранены',
        description: result.message || `Финансовые данные для ${modelName} успешно обновлены`,
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Ошибка сохранения',
        description: 'Не удалось сохранить данные. Попробуйте снова.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
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

  if (isLoading) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center justify-center py-12">
          <Icon name="Loader2" size={48} className="animate-spin text-primary" />
        </div>
      </div>
    );
  }

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
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          <Icon name={isSaving ? "Loader2" : "Save"} size={18} className={isSaving ? "animate-spin" : ""} />
          {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
        </Button>
      </div>

      <Card className="overflow-hidden bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="p-2 text-left font-semibold text-slate-300 sticky left-0 bg-slate-800 min-w-[140px]">Настоящий период</th>
                {onlineData.map((d) => (
                  <th key={d.date} className="p-2 text-center font-medium text-slate-300 whitespace-nowrap min-w-[60px] bg-slate-800">
                    {d.date}
                  </th>
                ))}
                <th className="p-2 text-center font-semibold text-slate-300 bg-slate-800 min-w-[80px]">
                  Tokens
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-700">
                <td className="p-2 font-medium sticky left-0 bg-slate-900 text-slate-300">Online CB</td>
                {onlineData.map((d, idx) => (
                  <td key={d.date} className="p-2 text-center">
                    <Input 
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={d.cb || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        handleCellChange(idx, 'cb', val === '' ? 0 : Number(val));
                      }}
                      className="w-14 h-8 text-center text-xs p-1 bg-slate-800 border-slate-700 text-slate-200"
                    />
                  </td>
                ))}
                <td className="p-2 text-center font-bold text-amber-500 bg-slate-800">{totalCbTokens}</td>
              </tr>

              <tr className="border-b border-slate-700 bg-red-950/30">
                <td className="p-2 font-medium sticky left-0 bg-red-950/30 text-slate-300">Chaturbate</td>
                {onlineData.map((d, idx) => (
                  <td key={d.date} className="p-2 text-center">
                    <div className="h-8 bg-slate-800 rounded"></div>
                  </td>
                ))}
                <td className="p-2 text-center font-bold text-amber-500 bg-slate-800">{totalChaturbateTokens}</td>
              </tr>

              <tr className="border-b border-slate-700">
                <td className="p-2 font-medium sticky left-0 bg-slate-900 text-slate-300">Online SP</td>
                {onlineData.map((d, idx) => (
                  <td key={d.date} className="p-2 text-center">
                    <Input 
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={d.sp || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        handleCellChange(idx, 'sp', val === '' ? 0 : Number(val));
                      }}
                      className="w-14 h-8 text-center text-xs p-1 bg-slate-800 border-slate-700 text-slate-200"
                    />
                  </td>
                ))}
                <td className="p-2 text-center font-bold text-amber-500 bg-slate-800">Tokens</td>
              </tr>

              <tr className="border-b border-slate-700 bg-purple-950/20">
                <td className="p-2 font-medium sticky left-0 bg-purple-950/20 text-slate-300">Stripchat</td>
                {onlineData.map((d, idx) => (
                  <td key={d.date} className="p-2 text-center">
                    <div className="h-8 bg-slate-800 rounded"></div>
                  </td>
                ))}
                <td className="p-2 text-center font-bold text-amber-500 bg-slate-800">{totalSpTokens}</td>
              </tr>

              <tr className="border-b border-slate-700">
                <td className="p-2 font-medium sticky left-0 bg-slate-900 text-slate-300">Online Soda</td>
                {onlineData.map((d, idx) => (
                  <td key={d.date} className="p-2 text-center">
                    <Input 
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={d.soda || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        handleCellChange(idx, 'soda', val === '' ? 0 : Number(val));
                      }}
                      className="w-14 h-8 text-center text-xs p-1 bg-slate-800 border-slate-700 text-slate-200"
                    />
                  </td>
                ))}
                <td className="p-2 text-center font-bold text-amber-500 bg-slate-800">Tokens</td>
              </tr>

              <tr className="border-b border-slate-700 bg-blue-950/20">
                <td className="p-2 font-medium sticky left-0 bg-blue-950/20 text-slate-300">CamSoda</td>
                {onlineData.map((d, idx) => (
                  <td key={d.date} className="p-2 text-center">
                    <div className="h-8 bg-slate-800 rounded"></div>
                  </td>
                ))}
                <td className="p-2 text-center font-bold text-amber-500 bg-slate-800">0</td>
              </tr>

              <tr className="border-b border-slate-700 bg-pink-950/20">
                <td className="p-2 font-medium sticky left-0 bg-pink-950/20 text-slate-300">Cam4</td>
                {onlineData.map((d, idx) => (
                  <td key={d.date} className="p-2 text-center">
                    <Input 
                      type="text"
                      inputMode="decimal"
                      value={d.cam4 || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, '');
                        handleCellChange(idx, 'cam4', val === '' ? 0 : Number(val));
                      }}
                      className="w-14 h-8 text-center text-xs p-1 bg-slate-800 border-slate-700 text-slate-200"
                    />
                  </td>
                ))}
                <td className="p-2 text-center font-bold text-amber-500 bg-slate-800">
                  {platformSummary[3].tokens.toFixed(1)}
                </td>
              </tr>

              <tr className="border-b border-slate-700 bg-teal-950/20">
                <td className="p-2 font-medium sticky left-0 bg-teal-950/20 text-slate-300">Переводы</td>
                {onlineData.map((d, idx) => (
                  <td key={d.date} className="p-2 text-center">
                    <div className="h-8 bg-slate-800 rounded"></div>
                  </td>
                ))}
                <td className="p-2 text-center font-bold text-amber-500 bg-slate-800">0</td>
              </tr>

              <tr className="border-b border-slate-700">
                <td className="p-2 font-medium sticky left-0 bg-slate-900 text-slate-300">Оператор (Имя)</td>
                {onlineData.map((d, idx) => (
                  <td key={d.date} className="p-2 text-center text-xs text-slate-500">
                    Имя
                  </td>
                ))}
                <td className="p-2 text-center"></td>
              </tr>

              <tr className="border-b border-slate-700">
                <td className="p-2 font-medium sticky left-0 bg-slate-900 text-slate-300">Смены</td>
                {onlineData.map((d, idx) => (
                  <td key={d.date} className="p-2 text-center">
                    <Checkbox 
                      checked={d.shift}
                      onCheckedChange={(checked) => handleCellChange(idx, 'shift', checked === true)}
                      className="border-slate-600"
                    />
                  </td>
                ))}
                <td className="p-2 text-center font-bold text-amber-500 bg-slate-800">{totalShifts}</td>
              </tr>

              <tr className="border-b border-slate-700 bg-green-950/30">
                <td className="p-2 font-bold sticky left-0 bg-green-950/30 text-slate-300">Income</td>
                {onlineData.map((d) => {
                  const total = d.cbIncome + d.spIncome + d.sodaIncome + d.cam4Income;
                  return (
                    <td key={d.date} className="p-2 text-center font-semibold text-green-400">
                      ${total.toFixed(2)}
                    </td>
                  );
                })}
                <td className="p-2 text-center font-bold text-lg text-green-400 bg-slate-800">
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