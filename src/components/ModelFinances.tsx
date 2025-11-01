import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import { getCurrentPeriod, getPreviousPeriod, getNextPeriod, Period } from '@/utils/periodUtils';
import { Card } from '@/components/ui/card';
import StatsCards from './model-finances/StatsCards';
import MobileView from './model-finances/MobileView';
import DesktopTable from './model-finances/DesktopTable';
import Charts from './model-finances/Charts';
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

      <MobileView 
        onlineData={onlineData} 
        operators={operators} 
        isReadOnly={isReadOnly} 
        onCellChange={handleCellChange} 
      />

      <DesktopTable 
        onlineData={onlineData} 
        operators={operators} 
        isReadOnly={isReadOnly} 
        onCellChange={handleCellChange} 
      />

      <Charts onlineData={onlineData} />
    </div>
  );
};

export default ModelFinances;
