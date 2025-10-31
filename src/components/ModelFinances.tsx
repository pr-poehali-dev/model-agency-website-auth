import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Icon from '@/components/ui/icon';
import { getCurrentPeriod, getDatesInPeriod, getPreviousPeriod, getNextPeriod, Period } from '@/utils/periodUtils';

interface ModelFinancesProps {
  modelId: number;
  modelName: string;
  currentUserEmail?: string;
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

const generateInitialData = (period: Period): DayData[] => {
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
const ASSIGNMENTS_API_URL = 'https://functions.poehali.dev/b7d8dd69-ab09-460d-999b-c0a1002ced30';
const USERS_API_URL = 'https://functions.poehali.dev/67fd6902-6170-487e-bb46-f6d14ec99066';
const PRODUCER_API_URL = 'https://functions.poehali.dev/a480fde5-8cc8-42e8-a535-626e393f6fa6';

const ModelFinances = ({ modelId, modelName, currentUserEmail, onBack }: ModelFinancesProps) => {
  const [currentPeriod, setCurrentPeriod] = useState<Period>(getCurrentPeriod());
  const [onlineData, setOnlineData] = useState<DayData[]>(generateInitialData(currentPeriod));
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [operators, setOperators] = useState<Array<{email: string, name: string}>>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadFinancialData();
    loadOperators();
  }, [modelId, currentPeriod]);

  const loadOperators = async () => {
    try {
      // Load all users
      const usersResponse = await fetch(USERS_API_URL);
      const users = await usersResponse.json();
      
      // Load ALL assignments
      const assignmentsResponse = await fetch(ASSIGNMENTS_API_URL);
      const allAssignments = await assignmentsResponse.json();
      
      // Filter assignments for this specific model by modelId
      const modelAssignments = allAssignments.filter((a: any) => a.modelId === modelId);
      
      // Get operator emails from filtered assignments
      const operatorEmails = modelAssignments.map((a: any) => a.operatorEmail);
      
      // Load producer assignments
      const producerResponse = await fetch(PRODUCER_API_URL);
      const producerAssignments = await producerResponse.json();
      
      // Find model user to get their email
      const model = users.find((u: any) => u.id === modelId);
      const modelEmail = model?.email;
      
      // Find producer assigned to this model
      const producerAssignment = producerAssignments.find(
        (pa: any) => pa.assignmentType === 'model' && pa.modelEmail === modelEmail
      );
      
      // Combine operator emails with producer email (if exists)
      const allAvailableEmails = producerAssignment?.producerEmail 
        ? [...operatorEmails, producerAssignment.producerEmail]
        : operatorEmails;
      
      // Filter users to get assigned operators + producer
      const assignedOperators = users
        .filter((u: any) => allAvailableEmails.includes(u.email))
        .map((u: any) => ({
          email: u.email,
          name: u.fullName || u.email
        }));
      
      setOperators(assignedOperators);
    } catch (error) {
      console.error('Failed to load operators:', error);
    }
  };

  const loadFinancialData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}?modelId=${modelId}`);
      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📡 Server data length:', data.length);
        console.log('📡 Server data:', data);
        
        // Always start with full period data
        const initialData = generateInitialData(currentPeriod);
        
        if (data.length > 0) {
          // Merge server data into generated data by matching dates
          const mergedData = initialData.map(dayData => {
            const serverRecord = data.find((d: DayData) => d.date === dayData.date);
            return serverRecord ? { ...dayData, ...serverRecord } : dayData;
          });
          setOnlineData(mergedData);
          console.log('✅ Merged server data with generated data');
        } else {
          setOnlineData(initialData);
          console.log('✅ Using generated initial data (server returned empty)');
        }
      } else {
        const initialData = generateInitialData(currentPeriod);
        setOnlineData(initialData);
        console.log('✅ Using generated initial data (server error)');
      }
    } catch (error) {
      console.error('❌ Failed to load financial data:', error);
      const initialData = generateInitialData(currentPeriod);
      setOnlineData(initialData);
      console.log('✅ Using generated initial data (network error)');
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

  const formatDate = (dateStr: string) => {
    // Convert "2024-10-16" to "16.10"
    const [, month, day] = dateStr.split('-');
    return `${day}.${month}`;
  };

  const totalCbTokens = onlineData.reduce((sum, d) => sum + d.cb, 0);
  const totalSpTokens = onlineData.reduce((sum, d) => sum + d.stripchatTokens, 0);
  const totalChaturbateTokens = Math.floor(totalCbTokens * 0.456);
  const totalIncome = onlineData.reduce((sum, d) => {
    const dailyIncome = ((d.cbIncome + d.spIncome + d.sodaIncome) * 0.05 + d.cam4Income + d.transfers) * 0.6;
    return sum + dailyIncome;
  }, 0);
  const totalShifts = onlineData.filter(d => d.shift).length;

  const graphOnlineData = onlineData.map(d => ({
    date: formatDate(d.date),
    onlineSP: d.sp,
    onlineCB: d.cb,
    onlineSoda: d.soda,
  }));

  const totalCbIncomeTokens = onlineData.reduce((sum, d) => sum + d.cbIncome, 0);
  const totalSpIncomeTokens = onlineData.reduce((sum, d) => sum + d.spIncome, 0);
  const totalSodaIncomeTokens = onlineData.reduce((sum, d) => sum + d.sodaIncome, 0);
  const totalCam4 = onlineData.reduce((sum, d) => sum + d.cam4, 0);
  
  const platformSummary = [
    { platform: 'Chaturbate', tokens: totalCbIncomeTokens, income: totalCbIncomeTokens * 0.05 * 0.6 },
    { platform: 'Stripchat', tokens: totalSpIncomeTokens, income: totalSpIncomeTokens * 0.05 * 0.6 },
    { platform: 'CamSoda', tokens: totalSodaIncomeTokens, income: totalSodaIncomeTokens * 0.05 * 0.6 },
    { platform: 'Cam4', tokens: totalCam4, income: totalCam4 * 0.6 },
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
        <div className="flex items-center gap-2">
          <Card className="p-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPeriod(getPreviousPeriod(currentPeriod))}
              >
                <Icon name="ChevronLeft" size={16} />
              </Button>
              <div className="font-semibold text-sm px-2">
                {currentPeriod.label}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPeriod(getNextPeriod(currentPeriod))}
              >
                <Icon name="ChevronRight" size={16} />
              </Button>
            </div>
          </Card>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            <Icon name={isSaving ? "Loader2" : "Save"} size={18} className={isSaving ? "animate-spin" : ""} />
            {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="p-2 text-left font-semibold text-foreground sticky left-0 bg-muted/50 min-w-[140px]">Настоящий период</th>
                {onlineData.map((d) => (
                  <th key={d.date} className="p-2 text-center font-medium text-foreground whitespace-nowrap min-w-[60px] bg-muted/50">
                    {formatDate(d.date)}
                  </th>
                ))}
                <th className="p-2 text-center font-semibold text-foreground bg-accent/10 min-w-[80px]">
                  Tokens
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b hover:bg-muted/30">
                <td className="p-2 font-medium sticky left-0 bg-background">Online CB</td>
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
                      className="w-14 h-8 text-center text-xs p-1"
                    />
                  </td>
                ))}
                <td className="p-2 text-center"></td>
              </tr>

              <tr className="border-b bg-red-500/5">
                <td className="p-2 font-medium sticky left-0 bg-red-500/5">Chaturbate</td>
                {onlineData.map((d, idx) => (
                  <td key={d.date} className="p-2 text-center">
                    <Input 
                      type="text"
                      inputMode="decimal"
                      value={d.cbIncome || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, '');
                        handleCellChange(idx, 'cbIncome', val === '' ? 0 : Number(val));
                      }}
                      className="w-14 h-8 text-center text-xs p-1"
                    />
                  </td>
                ))}
                <td className="p-2 text-center font-bold bg-red-500/10">{onlineData.reduce((sum, d) => sum + d.cbIncome, 0).toFixed(2)}</td>
              </tr>

              <tr className="border-b hover:bg-muted/30">
                <td className="p-2 font-medium sticky left-0 bg-background">Online SP</td>
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
                      className="w-14 h-8 text-center text-xs p-1"
                    />
                  </td>
                ))}
                <td className="p-2 text-center"></td>
              </tr>

              <tr className="border-b bg-purple-500/5">
                <td className="p-2 font-medium sticky left-0 bg-purple-500/5">Stripchat</td>
                {onlineData.map((d, idx) => (
                  <td key={d.date} className="p-2 text-center">
                    <Input 
                      type="text"
                      inputMode="decimal"
                      value={d.spIncome || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, '');
                        handleCellChange(idx, 'spIncome', val === '' ? 0 : Number(val));
                      }}
                      className="w-14 h-8 text-center text-xs p-1"
                    />
                  </td>
                ))}
                <td className="p-2 text-center font-bold bg-purple-500/10">{onlineData.reduce((sum, d) => sum + d.spIncome, 0).toFixed(2)}</td>
              </tr>

              <tr className="border-b hover:bg-muted/30">
                <td className="p-2 font-medium sticky left-0 bg-background">Online Soda</td>
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
                      className="w-14 h-8 text-center text-xs p-1"
                    />
                  </td>
                ))}
                <td className="p-2 text-center"></td>
              </tr>

              <tr className="border-b bg-blue-500/5">
                <td className="p-2 font-medium sticky left-0 bg-blue-500/5">CamSoda</td>
                {onlineData.map((d, idx) => (
                  <td key={d.date} className="p-2 text-center">
                    <Input 
                      type="text"
                      inputMode="decimal"
                      value={d.sodaIncome || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, '');
                        handleCellChange(idx, 'sodaIncome', val === '' ? 0 : Number(val));
                      }}
                      className="w-14 h-8 text-center text-xs p-1"
                    />
                  </td>
                ))}
                <td className="p-2 text-center font-bold bg-blue-500/10">{onlineData.reduce((sum, d) => sum + d.sodaIncome, 0).toFixed(2)}</td>
              </tr>

              <tr className="border-b bg-pink-500/5">
                <td className="p-2 font-medium sticky left-0 bg-pink-500/5">Cam4</td>
                {onlineData.map((d, idx) => (
                  <td key={d.date} className="p-2 text-center">
                    <Input 
                      type="text"
                      inputMode="decimal"
                      value={d.cam4Income || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, '');
                        handleCellChange(idx, 'cam4Income', val === '' ? 0 : Number(val));
                      }}
                      className="w-14 h-8 text-center text-xs p-1"
                    />
                  </td>
                ))}
                <td className="p-2 text-center font-bold bg-pink-500/10">
                  {onlineData.reduce((sum, d) => sum + d.cam4Income, 0).toFixed(2)}
                </td>
              </tr>

              <tr className="border-b hover:bg-muted/30">
                <td className="p-2 font-medium sticky left-0 bg-background">Переводы</td>
                {onlineData.map((d, idx) => (
                  <td key={d.date} className="p-2 text-center">
                    <Input 
                      type="text"
                      inputMode="decimal"
                      value={d.transfers || ''}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, '');
                        handleCellChange(idx, 'transfers', val === '' ? 0 : Number(val));
                      }}
                      className="w-14 h-8 text-center text-xs p-1"
                    />
                  </td>
                ))}
                <td className="p-2 text-center font-bold bg-accent/5">{onlineData.reduce((sum, d) => sum + d.transfers, 0).toFixed(2)}</td>
              </tr>

              <tr className="border-b hover:bg-muted/30">
                <td className="p-2 font-medium sticky left-0 bg-background">Оператор (Имя)</td>
                {onlineData.map((d, idx) => (
                  <td key={d.date} className="p-2 text-center">
                    <Select 
                      value={d.operator || 'none'} 
                      onValueChange={(value) => handleCellChange(idx, 'operator', value === 'none' ? '' : value)}
                    >
                      <SelectTrigger className="w-24 h-8 text-xs">
                        <SelectValue placeholder="Выбрать" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Не выбрано</SelectItem>
                        {operators.map((op) => (
                          <SelectItem key={op.email} value={op.name}>
                            {op.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                ))}
                <td className="p-2 text-center"></td>
              </tr>

              <tr className="border-b hover:bg-muted/30">
                <td className="p-2 font-medium sticky left-0 bg-background">Смены</td>
                {onlineData.map((d, idx) => (
                  <td key={d.date} className="p-2 text-center">
                    <Checkbox 
                      checked={d.shift}
                      onCheckedChange={(checked) => handleCellChange(idx, 'shift', checked === true)}
                    />
                  </td>
                ))}
                <td className="p-2 text-center font-bold bg-accent/5">{totalShifts}</td>
              </tr>

              <tr className="border-b bg-green-500/10">
                <td className="p-2 font-bold sticky left-0 bg-green-500/10">Income</td>
                {onlineData.map((d) => {
                  const dailyIncome = ((d.cbIncome + d.spIncome + d.sodaIncome) * 0.05 + d.cam4Income + d.transfers) * 0.6;
                  return (
                    <td key={d.date} className="p-2 text-center font-semibold text-green-600">
                      ${dailyIncome.toFixed(2)}
                    </td>
                  );
                })}
                <td className="p-2 text-center font-bold text-lg text-green-600 bg-green-500/20">
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
            <Line type="monotone" dataKey="onlineSoda" stroke="#3b82f6" name="CamSoda" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Доходы по дням</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={onlineData.map(d => ({ 
            date: formatDate(d.date), 
            CB: d.cbIncome * 0.05 * 0.6, 
            SP: d.spIncome * 0.05 * 0.6, 
            Soda: d.sodaIncome * 0.05 * 0.6,
            Cam4: d.cam4 * 0.6,
            Transfers: d.transfers * 0.6
          }))}>
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
            <Bar dataKey="Soda" fill="#3b82f6" name="CamSoda ($)" />
            <Bar dataKey="Cam4" fill="#ec4899" name="Cam4 ($)" />
            <Bar dataKey="Transfers" fill="#10b981" name="Переводы ($)" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

export default ModelFinances;