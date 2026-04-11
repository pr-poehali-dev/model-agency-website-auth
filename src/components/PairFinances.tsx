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

const API_URL =
  "https://functions.poehali.dev/99ec6654-50ec-4d09-8bfc-cdc60c8fec1e";

const generateInitialData = (period: Period): DayData[] =>
  getDatesInPeriod(period).map((date) => ({
    date,
    cb: 0, sp: 0, soda: 0,
    cbTokens: 0, spTokens: 0, sodaTokens: 0,
    cbIncome: 0, spIncome: 0, sodaIncome: 0,
    stripchatTokens: 0, cam4Tokens: 0, cam4Income: 0,
    transfers: 0, operator: "", shift: false,
  }));

const parseDay = (
  savedDay: Record<string, number | boolean | string>,
  initDay: DayData
): DayData => {
  let cbTokens, spTokens, sodaTokens;
  if (savedDay.cbTokens !== undefined) {
    cbTokens = savedDay.cbTokens as number;
    spTokens = (savedDay.spTokens as number) || 0;
    sodaTokens = (savedDay.sodaTokens as number) || 0;
  } else {
    cbTokens = (savedDay.cb as number) || 0;
    spTokens = (savedDay.sp as number) || 0;
    sodaTokens = (savedDay.soda as number) || 0;
  }
  const cam4Tokens = (savedDay.cam4Tokens as number) || 0;
  return {
    ...initDay,
    cb: (savedDay.cb as number) || 0,
    sp: (savedDay.sp as number) || 0,
    soda: (savedDay.soda as number) || 0,
    cbTokens,
    spTokens,
    sodaTokens,
    cbIncome: cbTokens * 0.045,
    spIncome: spTokens * 0.05,
    sodaIncome: sodaTokens * 0.04,
    stripchatTokens: (savedDay.stripchatTokens as number) || 0,
    cam4Tokens,
    cam4Income: cam4Tokens * 0.05,
    transfers: (savedDay.transfers as number) || 0,
    operator: (savedDay.operator as string) || "",
    shift: (savedDay.shift as boolean) || false,
  };
};

const mergeDayData = (a: DayData, b: DayData): DayData => ({
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
  userRole,
  onBack,
}: PairFinancesProps) => {
  const [currentPeriod, setCurrentPeriod] = useState<Period>(getCurrentPeriod());
  const [onlineData, setOnlineData] = useState<DayData[]>(generateInitialData(getCurrentPeriod()));
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving] = useState(false);
  const [lastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const onlineDataRef = useRef<DayData[]>(onlineData);
  const { toast } = useToast();

  const isReadOnly = true;

  useEffect(() => {
    onlineDataRef.current = onlineData;
  }, [onlineData]);

  useEffect(() => {
    loadData();
  }, [model1Id, model2Id, currentPeriod]);

  const loadData = async () => {
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

      const merged1 = initial.map((day) => {
        const saved = Array.isArray(data1)
          ? data1.find((d: Record<string, unknown>) => d.date === day.date)
          : null;
        return saved ? parseDay(saved as Record<string, number | boolean | string>, day) : day;
      });
      const merged2 = initial.map((day) => {
        const saved = Array.isArray(data2)
          ? data2.find((d: Record<string, unknown>) => d.date === day.date)
          : null;
        return saved ? parseDay(saved as Record<string, number | boolean | string>, day) : day;
      });

      setOnlineData(merged1.map((day, i) => mergeDayData(day, merged2[i])));
    } catch {
      toast({ title: "Ошибка", description: "Не удалось загрузить данные", variant: "destructive" });
      setOnlineData(generateInitialData(currentPeriod));
    } finally {
      setIsLoading(false);
    }
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

  const handleInputChange = useCallback(() => {}, []);
  const handleShiftChange = useCallback(() => {}, []);
  const handleOperatorChange = useCallback(() => {}, []);

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
        onSave={() => {}}
      />

      <FinancesTable
        onlineData={onlineData}
        operators={[]}
        isReadOnly={isReadOnly}
        isSoloMaker={false}
        blockedDates={{}}
        onInputChange={handleInputChange}
        onShiftChange={handleShiftChange}
        onOperatorChange={handleOperatorChange}
      />

      <FinancesCharts onlineData={onlineData} />
    </div>
  );
};

export default PairFinances;
