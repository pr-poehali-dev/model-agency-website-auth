import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  getCurrentPeriod,
  getDatesInPeriod,
  getPreviousPeriod,
  getNextPeriod,
  Period,
} from "@/utils/periodUtils";
import { authenticatedFetch } from "@/lib/api";
import FinancesHeader from "./model-finances-components/FinancesHeader";
import FinancesTable from "./model-finances-components/FinancesTable";
import FinancesCharts from "./model-finances-components/FinancesCharts";

interface PairFinancesProps {
  model1Id: number;
  model1Name: string;
  model2Id: number;
  model2Name: string;
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
  cam4Tokens: number;
  cam4Income: number;
  transfers: number;
  operator: string;
  shift: boolean;
}

const generateInitialData = (period: Period): DayData[] => {
  const dates = getDatesInPeriod(period);
  return dates.map((date) => ({
    date,
    cb: 0, sp: 0, soda: 0,
    cbTokens: 0, spTokens: 0, sodaTokens: 0,
    cbIncome: 0, spIncome: 0, sodaIncome: 0,
    stripchatTokens: 0, cam4Tokens: 0, cam4Income: 0,
    transfers: 0, operator: "", shift: false,
  }));
};

const API_URL = "https://functions.poehali.dev/99ec6654-50ec-4d09-8bfc-cdc60c8fec1e";
const ASSIGNMENTS_API_URL = "https://functions.poehali.dev/b7d8dd69-ab09-460d-999b-c0a1002ced30";
const USERS_API_URL = "https://functions.poehali.dev/67fd6902-6170-487e-bb46-f6d14ec99066";
const PRODUCER_API_URL = "https://functions.poehali.dev/a480fde5-8cc8-42e8-a535-626e393f6fa6";
const BLOCKED_DATES_API = "https://functions.poehali.dev/b37e0422-df3c-42f3-9e5c-04d8f1eedd5c";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const parseSavedDay = (savedDay: any, initDay: DayData): DayData => {
  let cbTokens, spTokens, sodaTokens;
  if (savedDay.cbTokens !== undefined) {
    cbTokens = savedDay.cbTokens;
    spTokens = savedDay.spTokens || 0;
    sodaTokens = savedDay.sodaTokens || 0;
  } else {
    cbTokens = savedDay.cb || 0;
    spTokens = savedDay.sp || 0;
    sodaTokens = savedDay.soda || 0;
  }
  const cam4Tokens = savedDay.cam4Tokens || 0;
  return {
    ...initDay,
    cb: savedDay.cb || 0,
    sp: savedDay.sp || 0,
    soda: savedDay.soda || 0,
    cbTokens,
    spTokens,
    sodaTokens,
    cbIncome: cbTokens * 0.045,
    spIncome: spTokens * 0.05,
    sodaIncome: sodaTokens * 0.04,
    stripchatTokens: savedDay.stripchatTokens || 0,
    cam4Tokens,
    cam4Income: cam4Tokens * 0.05,
    transfers: savedDay.transfers || 0,
    operator: savedDay.operator || "",
    shift: savedDay.shift || false,
  };
};

const mergeDays = (a: DayData, b: DayData): DayData => ({
  date: a.date,
  cb: a.cb + b.cb,
  sp: a.sp + b.sp,
  soda: a.soda + b.soda,
  cbTokens: a.cbTokens + b.cbTokens,
  spTokens: a.spTokens + b.spTokens,
  sodaTokens: a.sodaTokens + b.sodaTokens,
  cbIncome: a.cbIncome + b.cbIncome,
  spIncome: a.spIncome + b.spIncome,
  sodaIncome: a.sodaIncome + b.sodaIncome,
  stripchatTokens: a.stripchatTokens + b.stripchatTokens,
  cam4Tokens: a.cam4Tokens + b.cam4Tokens,
  cam4Income: a.cam4Income + b.cam4Income,
  transfers: a.transfers + b.transfers,
  operator: a.operator || b.operator,
  shift: a.shift || b.shift,
});

const PairFinances = ({
  model1Id,
  model1Name,
  model2Id,
  model2Name,
  currentUserEmail,
  userRole,
  onBack,
}: PairFinancesProps) => {
  const [currentPeriod, setCurrentPeriod] = useState<Period>(getCurrentPeriod());
  const [onlineData, setOnlineData] = useState<DayData[]>(generateInitialData(getCurrentPeriod()));
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [operators, setOperators] = useState<Array<{ email: string; name: string }>>([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const onlineDataRef = useRef<DayData[]>(onlineData);
  const [isSoloMaker] = useState(false);
  const [blockedDates, setBlockedDates] = useState<Record<string, { all?: boolean; chaturbate?: boolean; stripchat?: boolean }>>({});
  const { toast } = useToast();

  const isReadOnly = userRole === "content_maker";

  useEffect(() => {
    loadFinancialData();
    loadOperators();
    loadBlockedDates();
  }, [model1Id, model2Id, currentPeriod]);

  useEffect(() => {
    onlineDataRef.current = onlineData;
  }, [onlineData]);

  const loadOperators = async () => {
    try {
      const usersResponse = await authenticatedFetch(USERS_API_URL);
      if (!usersResponse.ok) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const users: any[] = await usersResponse.json();
      if (!Array.isArray(users)) return;

      const assignmentsResponse = await authenticatedFetch(ASSIGNMENTS_API_URL);
      if (!assignmentsResponse.ok) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allAssignments: any[] = await assignmentsResponse.json();
      if (!Array.isArray(allAssignments)) return;

      const producerResponse = await authenticatedFetch(`${PRODUCER_API_URL}?type=model`);
      if (!producerResponse.ok) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const producerAssignments: any[] = await producerResponse.json();
      if (!Array.isArray(producerAssignments)) return;

      const modelAssignments = allAssignments.filter(
        (a) => a.modelId === model1Id || a.modelId === model2Id,
      );
      const operatorEmails = modelAssignments.map((a) => a.operatorEmail);

      const assignedOperators: Array<{ email: string; name: string }> = users
        .filter((u) => operatorEmails.includes(u.email) && u.role === "operator")
        .map((u) => ({ email: u.email, name: u.fullName || u.email }));

      if (userRole === "producer" && currentUserEmail) {
        const currentUser = users.find((u) => u.email === currentUserEmail);
        if (currentUser && !assignedOperators.some((op) => op.email === currentUserEmail)) {
          assignedOperators.push({ email: currentUser.email, name: currentUser.fullName || currentUser.email });
        }
      }

      if (userRole === "director") {
        const soloMakers = users.filter((u) => u.role === "solo_maker");
        soloMakers.forEach((sm) => {
          if (!assignedOperators.some((op) => op.email === sm.email)) {
            assignedOperators.push({ email: sm.email, name: `${sm.fullName || sm.email} (Соло)` });
          }
        });
      }

      if (userRole === "solo_maker" && currentUserEmail) {
        const currentUser = users.find((u) => u.email === currentUserEmail);
        if (currentUser && !assignedOperators.some((op) => op.email === currentUserEmail)) {
          assignedOperators.push({ email: currentUser.email, name: `${currentUser.fullName || currentUser.email} (Соло)` });
        }
      }

      setOperators(assignedOperators);
    } catch (err) {
      console.error("Failed to load operators", err);
    }
  };

  const loadBlockedDates = async () => {
    try {
      const [res1, res2] = await Promise.all([
        authenticatedFetch(`${BLOCKED_DATES_API}?modelId=${model1Id}`),
        authenticatedFetch(`${BLOCKED_DATES_API}?modelId=${model2Id}`),
      ]);
      const data1 = res1.ok ? await res1.json() : [];
      const data2 = res2.ok ? await res2.json() : [];
      const blockedMap: Record<string, { all?: boolean; chaturbate?: boolean; stripchat?: boolean }> = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [...(Array.isArray(data1) ? data1 : []), ...(Array.isArray(data2) ? data2 : [])].forEach((item: any) => {
        const existing = blockedMap[item.date] || {};
        blockedMap[item.date] = {
          all: existing.all || item.all || false,
          chaturbate: existing.chaturbate || item.chaturbate || false,
          stripchat: existing.stripchat || item.stripchat || false,
        };
      });
      setBlockedDates(blockedMap);
    } catch (err) {
      console.error("Failed to load blocked dates", err);
    }
  };

  const loadFinancialData = async () => {
    setIsLoading(true);
    try {
      const dates = getDatesInPeriod(currentPeriod);
      const startDate = dates[0];
      const endDate = dates[dates.length - 1];
      const initial = generateInitialData(currentPeriod);

      const [res1, res2] = await Promise.all([
        authenticatedFetch(`${API_URL}?modelId=${model1Id}&startDate=${startDate}&endDate=${endDate}`),
        authenticatedFetch(`${API_URL}?modelId=${model2Id}&startDate=${startDate}&endDate=${endDate}`),
      ]);

      const data1 = res1.ok ? await res1.json() : [];
      const data2 = res2.ok ? await res2.json() : [];

      // Пара работает как единый счёт: берём данные только из первой модели.
      // Вторая модель используется только как резерв, если у первой нет данных за день.
      const merged = initial.map((day) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const saved1 = Array.isArray(data1) ? data1.find((d: any) => d.date === day.date) : null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const saved2 = Array.isArray(data2) ? data2.find((d: any) => d.date === day.date) : null;
        const hasData1 = saved1 && (saved1.cbTokens || saved1.spTokens || saved1.sodaTokens || saved1.cam4Tokens || saved1.transfers || saved1.cb || saved1.sp || saved1.soda);
        const hasData2 = saved2 && (saved2.cbTokens || saved2.spTokens || saved2.sodaTokens || saved2.cam4Tokens || saved2.transfers || saved2.cb || saved2.sp || saved2.soda);
        if (hasData1) return parseSavedDay(saved1, day);
        if (hasData2) return parseSavedDay(saved2, day);
        if (saved1) return parseSavedDay(saved1, day);
        return day;
      });

      setOnlineData(merged);
    } catch (err) {
      console.error("Failed to load financial data", err);
      setOnlineData(generateInitialData(currentPeriod));
    } finally {
      setIsLoading(false);
    }
  };

  const saveData = useCallback(async () => {
    if (isReadOnly) return;
    const dataToSave = onlineDataRef.current;
    setIsSaving(true);
    try {
      await Promise.all([
        authenticatedFetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ modelId: model1Id, data: dataToSave }),
        }),
        authenticatedFetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ modelId: model2Id, data: dataToSave }),
        }),
      ]);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      toast({ title: "Сохранено", description: "Финансовые данные успешно сохранены" });
    } catch (err) {
      console.error("Failed to save data", err);
      toast({ title: "Ошибка", description: "Не удалось сохранить данные", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  }, [model1Id, model2Id, toast, isReadOnly]);

  const handleInputChange = (date: string, field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setOnlineData((prev) =>
      prev.map((day) => {
        if (day.date !== date) return day;
        const updatedDay = { ...day, [field]: numValue };
        if (field === "cbTokens") updatedDay.cbIncome = numValue * 0.045;
        else if (field === "spTokens") updatedDay.spIncome = numValue * 0.05;
        else if (field === "sodaTokens") updatedDay.sodaIncome = numValue * 0.04;
        else if (field === "cam4Tokens") updatedDay.cam4Income = numValue * 0.05;
        return updatedDay;
      }),
    );
    setHasUnsavedChanges(true);
  };

  const handleShiftChange = (date: string, checked: boolean) => {
    setOnlineData((prev) =>
      prev.map((day) => (day.date === date ? { ...day, shift: checked } : day)),
    );
    setHasUnsavedChanges(true);
  };

  const handleOperatorChange = (date: string, value: string) => {
    setOnlineData((prev) =>
      prev.map((day) => (day.date === date ? { ...day, operator: value } : day)),
    );
    setHasUnsavedChanges(true);
  };

  const handlePreviousPeriod = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm("Есть несохранённые изменения. Перейти без сохранения?");
      if (!confirmed) return;
    }
    setHasUnsavedChanges(false);
    setCurrentPeriod(getPreviousPeriod(currentPeriod));
  };

  const handleNextPeriod = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm("Есть несохранённые изменения. Перейти без сохранения?");
      if (!confirmed) return;
    }
    setHasUnsavedChanges(false);
    setCurrentPeriod(getNextPeriod(currentPeriod));
  };

  if (isLoading) {
    return (
      <div className="animate-fade-in space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {model1Name} & {model2Name}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <FinancesHeader
        modelName={`${model1Name} & ${model2Name}`}
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

export default PairFinances;