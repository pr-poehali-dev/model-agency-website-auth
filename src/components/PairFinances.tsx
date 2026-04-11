import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  getCurrentPeriod,
  getDatesInPeriod,
  getPreviousPeriod,
  getNextPeriod,
  Period,
} from "@/utils/periodUtils";
import { authenticatedFetch } from "@/lib/api";
import FinancesCharts from "./model-finances-components/FinancesCharts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Icon from "@/components/ui/icon";

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

const parseDay = (savedDay: Record<string, number | boolean | string>, initDay: DayData): DayData => {
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
  const [combinedData, setCombinedData] = useState<DayData[]>(generateInitialData(getCurrentPeriod()));
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const isReadOnly = userRole === "content_maker";

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
        const saved = Array.isArray(data1) ? data1.find((d: Record<string, unknown>) => d.date === day.date) : null;
        return saved ? parseDay(saved as Record<string, number | boolean | string>, day) : day;
      });
      const merged2 = initial.map((day) => {
        const saved = Array.isArray(data2) ? data2.find((d: Record<string, unknown>) => d.date === day.date) : null;
        return saved ? parseDay(saved as Record<string, number | boolean | string>, day) : day;
      });

      setCombinedData(merged1.map((day, i) => mergeDayData(day, merged2[i])));
    } catch (err) {
      toast({ title: "Ошибка", description: "Не удалось загрузить данные", variant: "destructive" });
      setCombinedData(generateInitialData(currentPeriod));
    } finally {
      setIsLoading(false);
    }
  };

  const totalIncome = combinedData.reduce(
    (sum, d) => sum + d.cbIncome + d.spIncome + d.sodaIncome + d.cam4Income + d.transfers,
    0
  );

  const totalCbTokens = combinedData.reduce((s, d) => s + d.cbTokens, 0);
  const totalSpTokens = combinedData.reduce((s, d) => s + d.spTokens, 0);
  const totalSodaTokens = combinedData.reduce((s, d) => s + d.sodaTokens, 0);
  const totalCam4Tokens = combinedData.reduce((s, d) => s + d.cam4Tokens, 0);

  const handlePrev = () => setCurrentPeriod(getPreviousPeriod(currentPeriod));
  const handleNext = () => setCurrentPeriod(getNextPeriod(currentPeriod));

  if (isLoading) {
    return (
      <div className="animate-fade-in space-y-6">
        <h2 className="text-2xl font-bold text-foreground">
          {model1Name} & {model2Name}
        </h2>
        <p className="text-sm text-muted-foreground">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-3">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
            <Icon name="ArrowLeft" size={16} />
            Назад
          </Button>
        )}
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {model1Name} & {model2Name}
          </h2>
          <p className="text-sm text-muted-foreground">Финансы пары — суммарно</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handlePrev}>
          <Icon name="ChevronLeft" size={16} />
        </Button>
        <span className="text-sm font-medium min-w-[160px] text-center">
          {currentPeriod.label}
        </span>
        <Button variant="outline" size="sm" onClick={handleNext}>
          <Icon name="ChevronRight" size={16} />
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Общий доход</p>
          <p className="text-xl font-bold">${totalIncome.toFixed(2)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">CB токены</p>
          <p className="text-xl font-bold">{totalCbTokens}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">SP токены</p>
          <p className="text-xl font-bold">{totalSpTokens}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Soda / Cam4</p>
          <p className="text-xl font-bold">{totalSodaTokens + totalCam4Tokens}</p>
        </Card>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left p-2 font-medium">Дата</th>
              <th className="text-right p-2 font-medium">CB токены</th>
              <th className="text-right p-2 font-medium">CB $</th>
              <th className="text-right p-2 font-medium">SP токены</th>
              <th className="text-right p-2 font-medium">SP $</th>
              <th className="text-right p-2 font-medium">Soda ток.</th>
              <th className="text-right p-2 font-medium">Soda $</th>
              <th className="text-right p-2 font-medium">Cam4 ток.</th>
              <th className="text-right p-2 font-medium">Cam4 $</th>
              <th className="text-right p-2 font-medium">Переводы</th>
              <th className="text-right p-2 font-medium font-bold">Итого $</th>
            </tr>
          </thead>
          <tbody>
            {combinedData.filter(d =>
              d.cbTokens + d.spTokens + d.sodaTokens + d.cam4Tokens + d.transfers > 0
            ).length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center py-8 text-muted-foreground">
                  Нет данных за этот период
                </td>
              </tr>
            ) : (
              combinedData.map((day) => {
                const dayTotal = day.cbIncome + day.spIncome + day.sodaIncome + day.cam4Income + day.transfers;
                if (dayTotal === 0 && day.cbTokens === 0 && day.spTokens === 0 && day.sodaTokens === 0 && day.cam4Tokens === 0) return null;
                return (
                  <tr key={day.date} className="border-b hover:bg-muted/30">
                    <td className="p-2 font-medium">{day.date}</td>
                    <td className="p-2 text-right">{day.cbTokens || "—"}</td>
                    <td className="p-2 text-right">{day.cbIncome > 0 ? `$${day.cbIncome.toFixed(2)}` : "—"}</td>
                    <td className="p-2 text-right">{day.spTokens || "—"}</td>
                    <td className="p-2 text-right">{day.spIncome > 0 ? `$${day.spIncome.toFixed(2)}` : "—"}</td>
                    <td className="p-2 text-right">{day.sodaTokens || "—"}</td>
                    <td className="p-2 text-right">{day.sodaIncome > 0 ? `$${day.sodaIncome.toFixed(2)}` : "—"}</td>
                    <td className="p-2 text-right">{day.cam4Tokens || "—"}</td>
                    <td className="p-2 text-right">{day.cam4Income > 0 ? `$${day.cam4Income.toFixed(2)}` : "—"}</td>
                    <td className="p-2 text-right">{day.transfers > 0 ? `$${day.transfers.toFixed(2)}` : "—"}</td>
                    <td className="p-2 text-right font-bold">{dayTotal > 0 ? `$${dayTotal.toFixed(2)}` : "—"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
          <tfoot>
            <tr className="bg-muted/50 font-bold">
              <td className="p-2">Итого</td>
              <td className="p-2 text-right">{totalCbTokens}</td>
              <td className="p-2 text-right">${combinedData.reduce((s,d)=>s+d.cbIncome,0).toFixed(2)}</td>
              <td className="p-2 text-right">{totalSpTokens}</td>
              <td className="p-2 text-right">${combinedData.reduce((s,d)=>s+d.spIncome,0).toFixed(2)}</td>
              <td className="p-2 text-right">{totalSodaTokens}</td>
              <td className="p-2 text-right">${combinedData.reduce((s,d)=>s+d.sodaIncome,0).toFixed(2)}</td>
              <td className="p-2 text-right">{totalCam4Tokens}</td>
              <td className="p-2 text-right">${combinedData.reduce((s,d)=>s+d.cam4Income,0).toFixed(2)}</td>
              <td className="p-2 text-right">${combinedData.reduce((s,d)=>s+d.transfers,0).toFixed(2)}</td>
              <td className="p-2 text-right">${totalIncome.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </Card>

      <FinancesCharts onlineData={combinedData} />
    </div>
  );
};

export default PairFinances;