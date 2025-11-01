import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import { getCurrentPeriod, getPreviousPeriod, getNextPeriod, Period } from '@/utils/periodUtils';
import { Card } from '@/components/ui/card';
import StatsCards from './model-finances/StatsCards';
import Charts from './model-finances/Charts';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DayData, ModelFinancesProps, OperatorInfo } from './model-finances/types';
import { 
  generateInitialData, 
  API_URL, 
  ASSIGNMENTS_API_URL, 
  USERS_API_URL, 
  PRODUCER_API_URL 
} from './model-finances/utils';

const ModelFinances = ({ modelId, modelName, currentUserEmail, userRole, onBack }: ModelFinancesProps) => {
  const [currentPeriod, setCurrentPeriod] = useState<Period>(getCurrentPeriod());
  const [onlineData, setOnlineData] = useState<DayData[]>(generateInitialData(currentPeriod));
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [operators, setOperators] = useState<OperatorInfo[]>([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  
  const isReadOnly = userRole === 'content_maker';

  useEffect(() => {
    loadFinancialData();
    loadOperators();
  }, [modelId, currentPeriod]);

  const loadOperators = async () => {
    try {
      const usersResponse = await fetch(USERS_API_URL);
      const users = await usersResponse.json();
      
      const assignmentsResponse = await fetch(ASSIGNMENTS_API_URL);
      const allAssignments = await assignmentsResponse.json();
      
      const producerResponse = await fetch(`${PRODUCER_API_URL}?type=model`);
      const producerAssignments = await producerResponse.json();
      
      const modelAssignments = allAssignments.filter((a: any) => a.modelId === modelId);
      const operatorEmails = modelAssignments.map((a: any) => a.operatorEmail);
      
      const assignedOperators = users
        .filter((u: any) => operatorEmails.includes(u.email) && u.role === 'operator')
        .map((u: any) => ({
          email: u.email,
          name: u.fullName || u.email
        }));
      
      if (userRole === 'producer' && currentUserEmail) {
        const currentUser = users.find((u: any) => u.email === currentUserEmail);
        if (currentUser && !assignedOperators.some(op => op.email === currentUserEmail)) {
          assignedOperators.push({
            email: currentUser.email,
            name: currentUser.fullName || currentUser.email
          });
        }
      }
      
      if (userRole === 'director') {
        const modelUser = users.find((u: any) => u.id === modelId);
        if (modelUser) {
          const producerAssignment = producerAssignments.find(
            (pa: any) => pa.modelEmail === modelUser.email
          );
          
          if (producerAssignment) {
            const producer = users.find((u: any) => u.email === producerAssignment.producerEmail);
            if (producer && !assignedOperators.some(op => op.email === producer.email)) {
              assignedOperators.push({
                email: producer.email,
                name: producer.fullName || producer.email
              });
            }
          }
        }
      }
      
      setOperators(assignedOperators);
    } catch (error) {
      console.error('Failed to load operators:', error);
    }
  };

  const loadFinancialData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}?modelId=${modelId}`);
      
      if (response.ok) {
        const data = await response.json();
        const initialData = generateInitialData(currentPeriod);
        
        if (data.length > 0) {
          const mergedData = initialData.map(dayData => {
            const serverRecord = data.find((d: DayData) => d.date === dayData.date);
            return serverRecord ? { ...dayData, ...serverRecord } : dayData;
          });
          setOnlineData(mergedData);
        } else {
          setOnlineData(initialData);
        }
      } else {
        const initialData = generateInitialData(currentPeriod);
        setOnlineData(initialData);
      }
    } catch (error) {
      console.error('Failed to load financial data:', error);
      const initialData = generateInitialData(currentPeriod);
      setOnlineData(initialData);
    } finally {
      setIsLoading(false);
    }
  };
  
  const autoSave = useCallback(async (data: DayData[]) => {
    if (isReadOnly) return;
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId, data })
      });

      if (response.ok) {
        setLastSaved(new Date());
      }
    } catch (error) {
      console.error('Auto-save error:', error);
    }
  }, [modelId, isReadOnly]);

  const handleCellChange = (index: number, field: keyof DayData, value: string | number | boolean) => {
    const newData = [...onlineData];
    newData[index] = { ...newData[index], [field]: value };
    setOnlineData(newData);
    
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      autoSave(newData);
    }, 2000);
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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="outline" size="icon" onClick={onBack}>
              <Icon name="ArrowLeft" size={20} />
            </Button>
          )}
          <div>
            <h2 className="text-2xl lg:text-3xl font-serif font-bold text-foreground mb-2">
              Финансы — {modelName}
            </h2>
            <p className="text-sm text-muted-foreground">Статистика доходов по платформам</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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
          {!isReadOnly && (
            <>
              {lastSaved && (
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Icon name="Check" size={14} className="text-green-500" />
                  Сохранено {lastSaved.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
              <Button onClick={handleSave} disabled={isSaving} className="gap-2 w-full lg:w-auto">
                <Icon name={isSaving ? "Loader2" : "Save"} size={18} className={isSaving ? "animate-spin" : ""} />
                <span className="lg:inline">{isSaving ? 'Сохранение...' : 'Сохранить'}</span>
              </Button>
            </>
          )}
        </div>
      </div>

      <StatsCards onlineData={onlineData} />

      {/* Mobile View */}
      <div className="lg:hidden space-y-4">
        {onlineData.map((d, idx) => (
          <Card key={d.date} className="p-4 space-y-3">
            <div className="font-semibold text-sm mb-3">{d.date}</div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Online CB</label>
                <Input
                  type="number"
                  value={d.onlineCB || ''}
                  onChange={(e) => handleCellChange(idx, 'onlineCB', e.target.value)}
                  className="h-8 mt-1"
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Chaturbate</label>
                <Input
                  type="number"
                  value={d.chaturbate || ''}
                  onChange={(e) => handleCellChange(idx, 'chaturbate', e.target.value)}
                  className="h-8 mt-1"
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Online SP</label>
                <Input
                  type="number"
                  value={d.onlineSP || ''}
                  onChange={(e) => handleCellChange(idx, 'onlineSP', e.target.value)}
                  className="h-8 mt-1"
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Stripchat</label>
                <Input
                  type="number"
                  value={d.stripchat || ''}
                  onChange={(e) => handleCellChange(idx, 'stripchat', e.target.value)}
                  className="h-8 mt-1"
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Online Soda</label>
                <Input
                  type="number"
                  value={d.onlineSoda || ''}
                  onChange={(e) => handleCellChange(idx, 'onlineSoda', e.target.value)}
                  className="h-8 mt-1"
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">CamSoda</label>
                <Input
                  type="number"
                  value={d.camSoda || ''}
                  onChange={(e) => handleCellChange(idx, 'camSoda', e.target.value)}
                  className="h-8 mt-1"
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Cam4</label>
                <Input
                  type="number"
                  value={d.cam4 || ''}
                  onChange={(e) => handleCellChange(idx, 'cam4', e.target.value)}
                  className="h-8 mt-1"
                  disabled={isReadOnly}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Переводы</label>
                <Input
                  type="number"
                  value={d.transfers || ''}
                  onChange={(e) => handleCellChange(idx, 'transfers', e.target.value)}
                  className="h-8 mt-1"
                  disabled={isReadOnly}
                />
              </div>
            </div>
            
            <div>
              <label className="text-xs text-muted-foreground">Оператор</label>
              <Select
                value={d.operator || 'none'}
                onValueChange={(value) => handleCellChange(idx, 'operator', value === 'none' ? '' : value)}
                disabled={isReadOnly}
              >
                <SelectTrigger className="w-full h-8 mt-1">
                  <SelectValue placeholder="-" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-</SelectItem>
                  {operators.map(op => (
                    <SelectItem key={op.email} value={op.name}>{op.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Checkbox
                id={`shift-${idx}`}
                checked={d.isShift}
                onCheckedChange={(checked) => handleCellChange(idx, 'isShift', checked)}
                disabled={isReadOnly}
              />
              <label htmlFor={`shift-${idx}`} className="text-xs text-muted-foreground">Смена</label>
            </div>
            
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Income</span>
                <span className="font-semibold text-sm text-green-500">${d.income.toFixed(2)}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Desktop Table */}
      <Card className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-semibold min-w-[120px]" rowSpan={2}>Настоящий период</th>
              {onlineData.map((d) => (
                <th key={d.date} className="px-3 py-2 text-center font-medium min-w-[90px]">
                  {d.date}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b hover:bg-muted/30">
              <td className="px-4 py-3 font-medium">Online CB</td>
              {onlineData.map((d, idx) => (
                <td key={d.date} className="px-3 py-2">
                  <Input
                    type="number"
                    value={d.onlineCB || ''}
                    onChange={(e) => handleCellChange(idx, 'onlineCB', e.target.value)}
                    className="w-full h-9"
                    disabled={isReadOnly}
                  />
                </td>
              ))}
            </tr>
            <tr className="border-b hover:bg-muted/30">
              <td className="px-4 py-3 font-medium">Chaturbate</td>
              {onlineData.map((d, idx) => (
                <td key={d.date} className="px-3 py-2">
                  <Input
                    type="number"
                    value={d.chaturbate || ''}
                    onChange={(e) => handleCellChange(idx, 'chaturbate', e.target.value)}
                    className="w-full h-9"
                    disabled={isReadOnly}
                  />
                </td>
              ))}
            </tr>
            <tr className="border-b hover:bg-muted/30">
              <td className="px-4 py-3 font-medium">Online SP</td>
              {onlineData.map((d, idx) => (
                <td key={d.date} className="px-3 py-2">
                  <Input
                    type="number"
                    value={d.onlineSP || ''}
                    onChange={(e) => handleCellChange(idx, 'onlineSP', e.target.value)}
                    className="w-full h-9"
                    disabled={isReadOnly}
                  />
                </td>
              ))}
            </tr>
            <tr className="border-b hover:bg-muted/30">
              <td className="px-4 py-3 font-medium">Stripchat</td>
              {onlineData.map((d, idx) => (
                <td key={d.date} className="px-3 py-2">
                  <Input
                    type="number"
                    value={d.stripchat || ''}
                    onChange={(e) => handleCellChange(idx, 'stripchat', e.target.value)}
                    className="w-full h-9"
                    disabled={isReadOnly}
                  />
                </td>
              ))}
            </tr>
            <tr className="border-b hover:bg-muted/30">
              <td className="px-4 py-3 font-medium">Online Soda</td>
              {onlineData.map((d, idx) => (
                <td key={d.date} className="px-3 py-2">
                  <Input
                    type="number"
                    value={d.onlineSoda || ''}
                    onChange={(e) => handleCellChange(idx, 'onlineSoda', e.target.value)}
                    className="w-full h-9"
                    disabled={isReadOnly}
                  />
                </td>
              ))}
            </tr>
            <tr className="border-b hover:bg-muted/30">
              <td className="px-4 py-3 font-medium">CamSoda</td>
              {onlineData.map((d, idx) => (
                <td key={d.date} className="px-3 py-2">
                  <Input
                    type="number"
                    value={d.camSoda || ''}
                    onChange={(e) => handleCellChange(idx, 'camSoda', e.target.value)}
                    className="w-full h-9"
                    disabled={isReadOnly}
                  />
                </td>
              ))}
            </tr>
            <tr className="border-b hover:bg-muted/30">
              <td className="px-4 py-3 font-medium">Cam4</td>
              {onlineData.map((d, idx) => (
                <td key={d.date} className="px-3 py-2">
                  <Input
                    type="number"
                    value={d.cam4 || ''}
                    onChange={(e) => handleCellChange(idx, 'cam4', e.target.value)}
                    className="w-full h-9"
                    disabled={isReadOnly}
                  />
                </td>
              ))}
            </tr>
            <tr className="border-b hover:bg-muted/30">
              <td className="px-4 py-3 font-medium">Переводы</td>
              {onlineData.map((d, idx) => (
                <td key={d.date} className="px-3 py-2">
                  <Input
                    type="number"
                    value={d.transfers || ''}
                    onChange={(e) => handleCellChange(idx, 'transfers', e.target.value)}
                    className="w-full h-9"
                    disabled={isReadOnly}
                  />
                </td>
              ))}
            </tr>
            <tr className="border-b hover:bg-muted/30">
              <td className="px-4 py-3 font-medium">Оператор (Имя)</td>
              {onlineData.map((d, idx) => (
                <td key={d.date} className="px-3 py-2">
                  <Select
                    value={d.operator || 'none'}
                    onValueChange={(value) => handleCellChange(idx, 'operator', value === 'none' ? '' : value)}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger className="w-32 h-9">
                      <SelectValue placeholder="-" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-</SelectItem>
                      {operators.map(op => (
                        <SelectItem key={op.email} value={op.name}>{op.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
              ))}
            </tr>
            <tr className="border-b hover:bg-muted/30">
              <td className="px-4 py-3 font-medium">Смены</td>
              {onlineData.map((d, idx) => (
                <td key={d.date} className="px-3 py-2">
                  <div className="flex justify-center">
                    <Checkbox
                      checked={d.isShift}
                      onCheckedChange={(checked) => handleCellChange(idx, 'isShift', checked)}
                      disabled={isReadOnly}
                    />
                  </div>
                </td>
              ))}
            </tr>
            <tr className="bg-muted/50 font-semibold">
              <td className="px-4 py-3">Income</td>
              {onlineData.map((d) => (
                <td key={d.date} className="px-3 py-3 text-center text-green-500">
                  ${d.income.toFixed(2)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </Card>

      <Charts onlineData={onlineData} />
    </div>
  );
};

export default ModelFinances;