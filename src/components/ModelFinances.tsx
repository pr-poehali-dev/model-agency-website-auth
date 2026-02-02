import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  getCurrentPeriod,
  getDatesInPeriod,
  getPreviousPeriod,
  getNextPeriod,
  Period,
} from "@/utils/periodUtils";
import { authenticatedFetch } from '@/lib/api';
import FinancesHeader from './model-finances-components/FinancesHeader';
import FinancesTable from './model-finances-components/FinancesTable';
import FinancesCharts from './model-finances-components/FinancesCharts';

interface ModelFinancesProps {
  modelId: number;
  modelName: string;
  currentUserEmail?: string;
  userRole?: string;
  onBack?: () => void;
}

interface DayData {
  date: string;
  cb: number;
  sp: number;
  soda: number;
  cbTokens: number;
  spTokens: number;
  sodaTokens: number;
  cbIncome: number;
  spIncome: number;
  sodaIncome: number;
  stripchatTokens: number;
  transfers: number;
  operator: string;
  shift: boolean;
}

const generateInitialData = (period: Period): DayData[] => {
  const dates = getDatesInPeriod(period);

  return dates.map((date) => ({
    date,
    cb: 0,
    sp: 0,
    soda: 0,
    cbTokens: 0,
    spTokens: 0,
    sodaTokens: 0,
    cbIncome: 0,
    spIncome: 0,
    sodaIncome: 0,
    stripchatTokens: 0,
    transfers: 0,
    operator: "",
    shift: false,
  }));
};

const API_URL =
  "https://functions.poehali.dev/99ec6654-50ec-4d09-8bfc-cdc60c8fec1e";
const ASSIGNMENTS_API_URL =
  "https://functions.poehali.dev/b7d8dd69-ab09-460d-999b-c0a1002ced30";
const USERS_API_URL =
  "https://functions.poehali.dev/67fd6902-6170-487e-bb46-f6d14ec99066";
const PRODUCER_API_URL =
  "https://functions.poehali.dev/a480fde5-8cc8-42e8-a535-626e393f6fa6";
const BLOCKED_DATES_API =
  "https://functions.poehali.dev/b37e0422-df3c-42f3-9e5c-04d8f1eedd5c";

const ModelFinances = ({
  modelId,
  modelName,
  currentUserEmail,
  userRole,
  onBack,
}: ModelFinancesProps) => {
  const [currentPeriod, setCurrentPeriod] =
    useState<Period>(getCurrentPeriod());
  const [onlineData, setOnlineData] = useState<DayData[]>(
    generateInitialData(currentPeriod),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [operators, setOperators] = useState<
    Array<{ email: string; name: string }>
  >([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isSoloMaker, setIsSoloMaker] = useState(false);
  const [blockedDates, setBlockedDates] = useState<Record<string, { all?: boolean; chaturbate?: boolean; stripchat?: boolean }>>({});
  const { toast } = useToast();

  const isReadOnly = userRole === "content_maker";

  useEffect(() => {
    loadFinancialData();
    loadOperators();
    loadBlockedDates();
  }, [modelId, currentPeriod]);

  const loadOperators = async () => {
    try {
      const usersResponse = await authenticatedFetch(USERS_API_URL);
      
      if (!usersResponse.ok) {
        console.error('Failed to load users for operators: HTTP', usersResponse.status);
        return;
      }
      
      const users = await usersResponse.json();
      
      if (!Array.isArray(users)) {
        console.error('Invalid users response:', users);
        return;
      }
      
      const modelUser = users.find((u: any) => u.id === modelId);
      if (modelUser && modelUser.role === "solo_maker") {
        setIsSoloMaker(true);
      } else {
        setIsSoloMaker(false);
      }

      const assignmentsResponse = await authenticatedFetch(ASSIGNMENTS_API_URL);
      
      if (!assignmentsResponse.ok) {
        console.error('Failed to load assignments: HTTP', assignmentsResponse.status);
        return;
      }
      
      const allAssignments = await assignmentsResponse.json();
      
      if (!Array.isArray(allAssignments)) {
        console.error('Invalid assignments response:', allAssignments);
        return;
      }

      const producerResponse = await authenticatedFetch(`${PRODUCER_API_URL}?type=model`);
      
      if (!producerResponse.ok) {
        console.error('Failed to load producer assignments: HTTP', producerResponse.status);
        return;
      }
      
      const producerAssignments = await producerResponse.json();
      
      if (!Array.isArray(producerAssignments)) {
        console.error('Invalid producer assignments response:', producerAssignments);
        return;
      }

      const modelAssignments = allAssignments.filter(
        (a: any) => a.modelId === modelId,
      );

      const operatorEmails = modelAssignments.map((a: any) => a.operatorEmail);

      const assignedOperators = users
        .filter(
          (u: any) => operatorEmails.includes(u.email) && u.role === "operator",
        )
        .map((u: any) => ({
          email: u.email,
          name: u.fullName || u.email,
        }));

      if (userRole === "producer" && currentUserEmail) {
        const currentUser = users.find(
          (u: any) => u.email === currentUserEmail,
        );
        if (
          currentUser &&
          !assignedOperators.some((op) => op.email === currentUserEmail)
        ) {
          assignedOperators.push({
            email: currentUser.email,
            name: currentUser.fullName || currentUser.email,
          });
        }
      }

      if (userRole === "director") {
        const modelUser = users.find((u: any) => u.id === modelId);
        if (modelUser) {
          if (modelUser.role === "solo_maker") {
            if (!assignedOperators.some((op) => op.email === modelUser.email)) {
              assignedOperators.push({
                email: modelUser.email,
                name: `${modelUser.fullName || modelUser.email} (Соло)`,
              });
            }
          } else {
            const producerAssignment = producerAssignments.find(
              (pa: any) => pa.modelEmail === modelUser.email,
            );

            if (producerAssignment) {
              const producer = users.find(
                (u: any) => u.email === producerAssignment.producerEmail,
              );
              if (
                producer &&
                !assignedOperators.some((op) => op.email === producer.email)
              ) {
                assignedOperators.push({
                  email: producer.email,
                  name: producer.fullName || producer.email,
                });
              }
            }

            const soloMakers = users.filter((u: any) => u.role === "solo_maker");
            soloMakers.forEach((sm: any) => {
              if (!assignedOperators.some((op) => op.email === sm.email)) {
                assignedOperators.push({
                  email: sm.email,
                  name: `${sm.fullName || sm.email} (Соло)`,
                });
              }
            });
          }
        }
      }

      if (userRole === "solo_maker" && currentUserEmail) {
        const currentUser = users.find(
          (u: any) => u.email === currentUserEmail,
        );
        if (
          currentUser &&
          !assignedOperators.some((op) => op.email === currentUserEmail)
        ) {
          assignedOperators.push({
            email: currentUser.email,
            name: `${currentUser.fullName || currentUser.email} (Соло)`,
          });
        }
      }

      setOperators(assignedOperators);
    } catch (err) {
      console.error("Failed to load operators", err);
    }
  };

  const loadBlockedDates = async () => {
    try {
      const response = await authenticatedFetch(`${BLOCKED_DATES_API}?modelId=${modelId}`);
      
      if (!response.ok) {
        console.error('Failed to load blocked dates: HTTP', response.status);
        return;
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        const blockedMap: Record<string, { all?: boolean; chaturbate?: boolean; stripchat?: boolean }> = {};
        data.forEach((item: any) => {
          blockedMap[item.date] = {
            all: item.all || false,
            chaturbate: item.chaturbate || false,
            stripchat: item.stripchat || false,
          };
        });
        setBlockedDates(blockedMap);
      }
    } catch (err) {
      console.error('Failed to load blocked dates', err);
    }
  };

  const loadFinancialData = async () => {
    setIsLoading(true);
    try {
      const startDate = getDatesInPeriod(currentPeriod)[0];
      const endDate =
        getDatesInPeriod(currentPeriod)[
          getDatesInPeriod(currentPeriod).length - 1
        ];

      const response = await authenticatedFetch(
        `${API_URL}?modelId=${modelId}&startDate=${startDate}&endDate=${endDate}`,
      );

      if (!response.ok) {
        console.error('Failed to load financial data: HTTP', response.status);
        setOnlineData(generateInitialData(currentPeriod));
        setIsLoading(false);
        return;
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        console.error('Invalid financial data response:', data);
        setOnlineData(generateInitialData(currentPeriod));
        setIsLoading(false);
        return;
      }

      const initialData = generateInitialData(currentPeriod);

      const mergedData = initialData.map((initDay) => {
        const savedDay = data.find((d: any) => d.date === initDay.date);
        if (savedDay) {
          // Определяем, есть ли новые поля cbTokens или используем старую структуру
          let cbTokens, spTokens, sodaTokens;
          
          if (savedDay.cbTokens !== undefined) {
            // Новая структура - используем напрямую
            cbTokens = savedDay.cbTokens;
            spTokens = savedDay.spTokens || 0;
            sodaTokens = savedDay.sodaTokens || 0;
          } else {
            // Старая структура - cb/sp/soda это были токены
            cbTokens = savedDay.cb || 0;
            spTokens = savedDay.sp || 0;
            sodaTokens = savedDay.soda || 0;
          }
          
          // Пересчитываем общий чек из токенов (токены × 0.05)
          const cbIncome = cbTokens * 0.05;
          const spIncome = spTokens * 0.05;
          const sodaIncome = sodaTokens * 0.05;
          
          return {
            ...initDay,
            cb: 0, // Онлайн - новое поле, пока 0
            sp: 0,
            soda: 0,
            cbTokens,
            spTokens,
            sodaTokens,
            cbIncome,
            spIncome,
            sodaIncome,
            stripchatTokens: savedDay.stripchatTokens || 0,
            transfers: savedDay.transfers || 0,
            operator: savedDay.operator || "",
            shift: savedDay.shift || false,
          };
        }
        return initDay;
      });

      setOnlineData(mergedData);
    } catch (err) {
      console.error("Failed to load financial data", err);
      setOnlineData(generateInitialData(currentPeriod));
    } finally {
      setIsLoading(false);
    }
  };

  const saveData = useCallback(async () => {
    if (isReadOnly) return;

    setIsSaving(true);
    try {
      console.log('Saving data:', onlineData.slice(0, 3));
      const response = await authenticatedFetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          modelId,
          data: onlineData,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save data");
      }

      setLastSaved(new Date());
      toast({
        title: "Сохранено",
        description: "Финансовые данные успешно сохранены",
      });
    } catch (err) {
      console.error("Failed to save data", err);
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить данные",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [modelId, onlineData, toast, isReadOnly]);

  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      saveData();
    }, 3000);
  }, [saveData]);

  const handleInputChange = (date: string, field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setOnlineData((prev) =>
      prev.map((day) => {
        if (day.date !== date) return day;
        
        const updatedDay = { ...day, [field]: numValue };
        
        // Пересчитываем общий чек для каждой площадки (токены × 0.05)
        if (field === 'cbTokens') {
          updatedDay.cbIncome = numValue * 0.05;
        } else if (field === 'spTokens') {
          updatedDay.spIncome = numValue * 0.05;
        } else if (field === 'sodaTokens') {
          updatedDay.sodaIncome = numValue * 0.05;
        }
        
        return updatedDay;
      }),
    );
    scheduleAutoSave();
  };

  const handleShiftChange = (date: string, checked: boolean) => {
    setOnlineData((prev) =>
      prev.map((day) => (day.date === date ? { ...day, shift: checked } : day)),
    );
    scheduleAutoSave();
  };

  const handleOperatorChange = (date: string, value: string) => {
    setOnlineData((prev) =>
      prev.map((day) =>
        day.date === date ? { ...day, operator: value } : day,
      ),
    );
    scheduleAutoSave();
  };

  const handlePreviousPeriod = () => {
    setCurrentPeriod(getPreviousPeriod(currentPeriod));
  };

  const handleNextPeriod = () => {
    setCurrentPeriod(getNextPeriod(currentPeriod));
  };

  if (isLoading) {
    return (
      <div className="animate-fade-in space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{modelName}</h2>
          <p className="text-sm text-muted-foreground mt-1">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <FinancesHeader
        modelName={modelName}
        currentPeriod={currentPeriod}
        isSaving={isSaving}
        lastSaved={lastSaved}
        onBack={onBack}
        onPreviousPeriod={handlePreviousPeriod}
        onNextPeriod={handleNextPeriod}
        onSave={saveData}
      />

      <FinancesTable
        onlineData={onlineData}
        operators={operators}
        isReadOnly={isReadOnly}
        isSoloMaker={isSoloMaker}
        blockedDates={blockedDates}
        onInputChange={handleInputChange}
        onShiftChange={handleShiftChange}
        onOperatorChange={handleOperatorChange}
      />

      <FinancesCharts onlineData={onlineData} />
    </div>
  );
};

export default ModelFinances;