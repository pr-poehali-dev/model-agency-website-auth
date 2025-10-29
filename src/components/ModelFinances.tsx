import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
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
  cbIncome: number;
  sp: number;
  spIncome: number;
  soda: number;
  sodaIncome: number;
  cam4: number;
  cam4Income: number;
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
    cbIncome: 0,
    sp: 0,
    spIncome: 0,
    soda: 0,
    sodaIncome: 0,
    cam4: 0,
    cam4Income: 0,
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
        } else {
          setOnlineData(generateInitialData());
        }
      } else {
        setOnlineData(generateInitialData());
      }
    } catch (error) {
      console.error('Failed to load financial data:', error);
      setOnlineData(generateInitialData());
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCellChange = (dateIndex: number, field: keyof DayData, value: string | number | boolean) => {
    const newData = [...onlineData];
    newData[dateIndex] = { ...newData[dateIndex], [field]: value };
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

  const calculateTotals = () => {
    const cbTokensSum = onlineData.reduce((sum, d) => sum + d.cb, 0);
    const spTokensSum = onlineData.reduce((sum, d) => sum + d.sp, 0);
    const sodaTokensSum = onlineData.reduce((sum, d) => sum + d.soda, 0);
    const cam4Sum = onlineData.reduce((sum, d) => sum + d.cam4, 0);
    const transfersSum = onlineData.reduce((sum, d) => sum + d.transfers, 0);
    const shiftsCount = onlineData.filter(d => d.shift).length;
    
    const totalIncome = onlineData.reduce((sum, d) => 
      sum + d.cbIncome + d.spIncome + d.sodaIncome + d.cam4Income, 0);

    return {
      cbTokensSum,
      spTokensSum,
      sodaTokensSum,
      cam4Sum,
      transfersSum,
      shiftsCount,
      totalIncome
    };
  };

  const totals = calculateTotals();

  const formatDate = (dateStr: string) => {
    const [, month, day] = dateStr.split('-');
    return `${day}.${month}`;
  };

  const rows = [
    { label: 'Online CB', field: 'cb' as const, color: 'bg-slate-700' },
    { label: 'Chaturbate', field: 'cbIncome' as const, color: 'bg-red-900/30' },
    { label: 'Online SP', field: 'sp' as const, color: 'bg-slate-700' },
    { label: 'Stripchat', field: 'spIncome' as const, color: 'bg-purple-900/30' },
    { label: 'Online Soda', field: 'soda' as const, color: 'bg-slate-700' },
    { label: 'CamSoda', field: 'sodaIncome' as const, color: 'bg-blue-900/30' },
    { label: 'Cam4', field: 'cam4' as const, color: 'bg-purple-900/30' },
    { label: 'Переводы', field: 'transfers' as const, color: 'bg-teal-900/30' },
    { label: 'Оператор (Имя)', field: 'operator' as const, color: 'bg-slate-800' },
    { label: 'Смены', field: 'shift' as const, color: 'bg-slate-800' },
    { label: 'Income', field: 'income' as const, color: 'bg-slate-900' },
  ];

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <Icon name="ArrowLeft" size={20} />
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-bold">{modelName}</h2>
            <p className="text-sm text-muted-foreground">Настоящий период</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <Icon name="Save" size={16} className="mr-2" />
          {isSaving ? 'Сохранение...' : 'Сохранить'}
        </Button>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="sticky left-0 z-20 bg-card px-4 py-3 text-left text-sm font-medium min-w-[180px]">
                Настоящий период
              </th>
              {onlineData.map((day, idx) => (
                <th key={idx} className="px-2 py-3 text-center text-sm font-medium min-w-[80px]">
                  {formatDate(day.date)}
                </th>
              ))}
              <th className="sticky right-0 z-20 bg-card px-4 py-3 text-center text-sm font-medium min-w-[100px]">
                Tokens
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr key={rowIdx} className={`border-b border-border/50 ${row.color}`}>
                <td className="sticky left-0 z-10 bg-inherit px-4 py-2 text-sm font-medium">
                  {row.label}
                </td>
                {onlineData.map((day, colIdx) => (
                  <td key={colIdx} className="px-2 py-2">
                    {row.field === 'shift' ? (
                      <div className="flex justify-center">
                        <Checkbox
                          checked={day.shift}
                          onCheckedChange={(checked) => 
                            handleCellChange(colIdx, 'shift', checked === true)
                          }
                        />
                      </div>
                    ) : row.field === 'operator' ? (
                      <Input
                        value={day.operator}
                        onChange={(e) => handleCellChange(colIdx, 'operator', e.target.value)}
                        className="h-8 text-sm bg-background/50 border-border/50"
                        placeholder="Имя"
                      />
                    ) : row.field === 'income' ? (
                      <div className="text-center text-sm font-medium text-green-400">
                        ${(day.cbIncome + day.spIncome + day.sodaIncome + day.cam4Income).toFixed(2)}
                      </div>
                    ) : (
                      <Input
                        type="number"
                        value={day[row.field] || ''}
                        onChange={(e) => handleCellChange(colIdx, row.field, parseFloat(e.target.value) || 0)}
                        className="h-8 text-sm bg-background/50 border-border/50 text-center"
                        placeholder="0"
                      />
                    )}
                  </td>
                ))}
                <td className="sticky right-0 z-10 bg-inherit px-4 py-2 text-center text-sm font-medium">
                  {row.field === 'cb' && totals.cbTokensSum}
                  {row.field === 'sp' && totals.spTokensSum}
                  {row.field === 'soda' && totals.sodaTokensSum}
                  {row.field === 'cam4' && totals.cam4Sum}
                  {row.field === 'transfers' && totals.transfersSum}
                  {row.field === 'shift' && totals.shiftsCount}
                  {row.field === 'income' && (
                    <span className="text-green-400">${totals.totalIncome.toFixed(2)}</span>
                  )}
                  {!['cb', 'sp', 'soda', 'cam4', 'transfers', 'shift', 'income'].includes(row.field) && ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default ModelFinances;
