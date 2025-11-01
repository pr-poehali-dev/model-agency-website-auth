import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import { getCurrentPeriod, getPreviousPeriod, getNextPeriod, Period } from '@/utils/periodUtils';
import StatsCards from './model-finances/StatsCards';
import Charts from './model-finances/Charts';
import FinancialTable from './model-finances/FinancialTable';
import PeriodNavigation from './model-finances/PeriodNavigation';
import ActionButtons from './model-finances/ActionButtons';
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

  const handleClearData = () => {
    if (confirm('Вы уверены, что хотите очистить все данные за текущий период?')) {
      const clearedData = generateInitialData(currentPeriod);
      setOnlineData(clearedData);
      autoSave(clearedData);
      toast({
        title: 'Данные очищены',
        description: 'Все данные за текущий период были удалены',
      });
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
          <PeriodNavigation
            currentPeriod={currentPeriod}
            onPreviousPeriod={() => setCurrentPeriod(getPreviousPeriod(currentPeriod))}
            onNextPeriod={() => setCurrentPeriod(getNextPeriod(currentPeriod))}
          />
          {!isReadOnly && (
            <ActionButtons
              isSaving={isSaving}
              isReadOnly={isReadOnly}
              lastSaved={lastSaved}
              onSave={handleSave}
              onClearData={handleClearData}
            />
          )}
        </div>
      </div>

      <StatsCards onlineData={onlineData} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Charts onlineData={onlineData} />
      </div>

      <FinancialTable
        onlineData={onlineData}
        operators={operators}
        isReadOnly={isReadOnly}
        onCellChange={handleCellChange}
      />
    </div>
  );
};

export default ModelFinances;
