import { useState, useEffect, useCallback, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import Icon from "@/components/ui/icon";
import {
  getCurrentPeriod,
  getDatesInPeriod,
  getPreviousPeriod,
  getNextPeriod,
  Period,
} from "@/utils/periodUtils";

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
  cbIncome: number;
  spIncome: number;
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
    cbIncome: 0,
    spIncome: 0,
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
      // Load all users
      const usersResponse = await fetch(USERS_API_URL);
      const users = await usersResponse.json();
      
      // Check if current model is a solo maker
      const modelUser = users.find((u: any) => u.id === modelId);
      if (modelUser && modelUser.role === "solo_maker") {
        setIsSoloMaker(true);
      } else {
        setIsSoloMaker(false);
      }

      // Load ALL assignments
      const assignmentsResponse = await fetch(ASSIGNMENTS_API_URL);
      const allAssignments = await assignmentsResponse.json();

      // Load producer assignments
      const producerResponse = await fetch(`${PRODUCER_API_URL}?type=model`);
      const producerAssignments = await producerResponse.json();

      // Filter assignments for this specific model by modelId
      const modelAssignments = allAssignments.filter(
        (a: any) => a.modelId === modelId,
      );

      // Get operator emails from filtered assignments
      const operatorEmails = modelAssignments.map((a: any) => a.operatorEmail);

      // Filter users to get assigned operators (include operators)
      const assignedOperators = users
        .filter(
          (u: any) => operatorEmails.includes(u.email) && u.role === "operator",
        )
        .map((u: any) => ({
          email: u.email,
          name: u.fullName || u.email,
        }));

      // If current user is producer, add them to the list
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

      // If current user is director, find producer assigned to this model AND add all solo makers
      if (userRole === "director") {
        // Get model email from users by modelId
        const modelUser = users.find((u: any) => u.id === modelId);
        if (modelUser) {
          // Check if this model is a solo maker - if so, only add this solo maker
          if (modelUser.role === "solo_maker") {
            // Add only this solo maker
            if (!assignedOperators.some((op) => op.email === modelUser.email)) {
              assignedOperators.push({
                email: modelUser.email,
                name: `${modelUser.fullName || modelUser.email} (Соло)`,
              });
            }
          } else {
            // For regular models, add producer and all solo makers
            // Find producer assignment for this model
            const producerAssignment = producerAssignments.find(
              (pa: any) => pa.modelEmail === modelUser.email,
            );

            if (producerAssignment) {
              // Find the producer user
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

            // Add all solo makers to the list for regular models
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

      // If current user is solo_maker, add themselves to the list
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
            name: currentUser.fullName || currentUser.email,
          });
        }
      }

      setOperators(assignedOperators);
    } catch (error) {
      console.error("Failed to load operators:", error);
    }
  };

  const loadBlockedDates = async () => {
    try {
      const response = await fetch(BLOCKED_DATES_API, {
        headers: {
          "X-User-Id": currentUserEmail || "",
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Создаём объект с информацией о блокировках по датам
        const blockedMap: Record<string, { all?: boolean; chaturbate?: boolean; stripchat?: boolean }> = {};
        
        data.blocked_dates.forEach((bd: any) => {
          if (!blockedMap[bd.date]) {
            blockedMap[bd.date] = {};
          }
          if (bd.platform === 'all') {
            blockedMap[bd.date].all = true;
          } else if (bd.platform === 'chaturbate') {
            blockedMap[bd.date].chaturbate = true;
          } else if (bd.platform === 'stripchat') {
            blockedMap[bd.date].stripchat = true;
          }
        });
        
        setBlockedDates(blockedMap);
      }
    } catch (error) {
      console.error("Failed to load blocked dates:", error);
    }
  };

  const loadFinancialData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}?modelId=${modelId}`);
      console.log("📡 Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("📡 Server data length:", data.length);
        console.log("📡 Server data:", data);

        // Always start with full period data
        const initialData = generateInitialData(currentPeriod);

        if (data.length > 0) {
          // Merge server data into generated data by matching dates
          const mergedData = initialData.map((dayData) => {
            const serverRecord = data.find(
              (d: DayData) => d.date === dayData.date,
            );
            return serverRecord ? { ...dayData, ...serverRecord } : dayData;
          });
          setOnlineData(mergedData);
          console.log("✅ Merged server data with generated data");
        } else {
          setOnlineData(initialData);
          console.log(
            "✅ Using generated initial data (server returned empty)",
          );
        }
      } else {
        const initialData = generateInitialData(currentPeriod);
        setOnlineData(initialData);
        console.log("✅ Using generated initial data (server error)");
      }
    } catch (error) {
      console.error("❌ Failed to load financial data:", error);
      const initialData = generateInitialData(currentPeriod);
      setOnlineData(initialData);
      console.log("✅ Using generated initial data (network error)");
    } finally {
      setIsLoading(false);
    }
  };

  const autoSave = useCallback(
    async (data: DayData[]) => {
      if (isReadOnly) return;

      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ modelId, data }),
        });

        if (response.ok) {
          setLastSaved(new Date());
        }
      } catch (error) {
        console.error("Auto-save error:", error);
      }
    },
    [modelId, isReadOnly],
  );

  const handleCellChange = (
    index: number,
    field: keyof DayData,
    value: string | number | boolean,
  ) => {
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

      const result = await response.json();

      toast({
        title: "Данные сохранены",
        description:
          result.message ||
          `Финансовые данные для ${modelName} успешно обновлены`,
      });
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Ошибка сохранения",
        description: "Не удалось сохранить данные. Попробуйте снова.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    // Convert "2024-10-16" to "16.10"
    const [, month, day] = dateStr.split("-");
    return `${day}.${month}`;
  };

  const totalCbTokens = onlineData.reduce((sum, d) => sum + d.cb, 0);
  const totalSpTokens = onlineData.reduce(
    (sum, d) => sum + d.stripchatTokens,
    0,
  );
  const totalChaturbateTokens = Math.floor(totalCbTokens * 0.456);
  
  // For solo makers, don't multiply by 0.6 (show gross income)
  const incomeMultiplier = isSoloMaker ? 1 : 0.6;
  
  const totalIncome = onlineData.reduce((sum, d) => {
    const dailyIncome =
      ((d.cbIncome + d.spIncome) * 0.05 +
        d.transfers) *
      incomeMultiplier;
    return sum + dailyIncome;
  }, 0);
  const totalShifts = onlineData.filter((d) => d.shift).length;

  const graphOnlineData = onlineData.map((d) => ({
    date: formatDate(d.date),
    onlineSP: d.sp,
    onlineCB: d.cb,
  }));

  const totalCbIncomeTokens = onlineData.reduce(
    (sum, d) => sum + d.cbIncome,
    0,
  );
  const totalSpIncomeTokens = onlineData.reduce(
    (sum, d) => sum + d.spIncome,
    0,
  );
  const platformSummary = [
    {
      platform: "Chaturbate",
      tokens: totalCbIncomeTokens,
      income: totalCbIncomeTokens * 0.05 * incomeMultiplier,
    },
    {
      platform: "Stripchat",
      tokens: totalSpIncomeTokens,
      income: totalSpIncomeTokens * 0.05 * incomeMultiplier,
    },
  ];

  const averageDaily = totalShifts > 0 ? totalIncome / totalShifts : 0;
  const bestDay = onlineData.reduce((best, current) => {
    const currentIncome =
      ((current.cbIncome + current.spIncome) * 0.05 +
        current.transfers) *
      incomeMultiplier;
    const bestIncome =
      ((best.cbIncome + best.spIncome) * 0.05 +
        best.transfers) *
      incomeMultiplier;
    return currentIncome > bestIncome ? current : best;
  }, onlineData[0]);
  const bestDayIncome =
    ((bestDay.cbIncome + bestDay.spIncome) * 0.05 +
      bestDay.transfers) *
    incomeMultiplier;

  if (isLoading) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center justify-center py-12">
          <Icon
            name="Loader2"
            size={48}
            className="animate-spin text-primary"
          />
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
            <div className="flex items-center gap-3">
              <h2 className="text-2xl lg:text-3xl font-serif font-bold text-foreground mb-2">
                Финансы — {modelName}
              </h2>
              {isSoloMaker && (
                <Badge className="bg-purple-500/20 text-purple-600 border-purple-500/30 mb-2">
                  <Icon name="Star" size={14} className="mr-1" />
                  Соло-мейкер
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Статистика доходов по платформам
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Card className="p-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPeriod(getPreviousPeriod(currentPeriod))
                }
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
          {!isReadOnly && lastSaved && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Icon name="Check" size={14} className="text-green-500" />
              Сохранено{" "}
              {lastSaved.toLocaleTimeString("ru-RU", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Всего за период</p>
            <Icon name="DollarSign" size={20} className="text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-600">
            ${totalIncome.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {totalShifts} смен
          </p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Средний доход</p>
            <Icon name="TrendingUp" size={20} className="text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-blue-600">
            ${averageDaily.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">за смену</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Лучший день</p>
            <Icon name="Star" size={20} className="text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-purple-600">
            ${bestDayIncome.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatDate(bestDay.date)}
          </p>
        </Card>
      </div>

      <div className="lg:hidden space-y-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">По дням</h3>
            <Badge>{totalIncome.toFixed(0)}$</Badge>
          </div>
          {onlineData.map((d, idx) => {
            const dateBlocks = blockedDates[d.date];
            const isBlocked = dateBlocks?.all;
            return (
              <Card key={d.date} className={`p-4 mb-3 ${isBlocked ? 'bg-muted/50 opacity-70' : 'bg-muted/30'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{formatDate(d.date)}</p>
                    {isBlocked && (
                      <Icon name="Lock" size={14} className="text-destructive" />
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={d.shift ? "bg-green-500/20" : ""}
                  >
                    {d.shift ? "Смена" : "Нет смены"}
                  </Badge>
                </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">CB:</span>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={d.cb || ""}
                    disabled={isReadOnly}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "");
                      handleCellChange(idx, "cb", val === "" ? 0 : Number(val));
                    }}
                    className="w-20 h-8 text-right"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Chaturbate $:</span>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={d.cbIncome || ""}
                    disabled={isReadOnly || (userRole !== 'director' && (dateBlocks?.all || dateBlocks?.chaturbate))}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.]/g, "");
                      handleCellChange(
                        idx,
                        "cbIncome",
                        val === "" ? 0 : Number(val),
                      );
                    }}
                    className="w-20 h-8 text-right"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">SP:</span>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={d.sp || ""}
                    disabled={isReadOnly}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "");
                      handleCellChange(idx, "sp", val === "" ? 0 : Number(val));
                    }}
                    className="w-20 h-8 text-right"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Stripchat $:</span>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={d.spIncome || ""}
                    disabled={isReadOnly || (userRole !== 'director' && (dateBlocks?.all || dateBlocks?.stripchat))}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.]/g, "");
                      handleCellChange(
                        idx,
                        "spIncome",
                        val === "" ? 0 : Number(val),
                      );
                    }}
                    className="w-20 h-8 text-right"
                  />
                </div>

                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between font-semibold text-green-600">
                    <span>Доход:</span>
                    <span>
                      $
                      {(
                        ((d.cbIncome + d.spIncome) * 0.05 +
                          d.transfers) *
                        incomeMultiplier
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          );
          })}
        </Card>
      </div>

      <Card className="overflow-hidden hidden lg:block">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          <table className="w-full text-sm border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-border">
                <th className="p-2 text-left font-semibold text-foreground sticky left-0 bg-muted/50 min-w-[140px]">
                  Настоящий период
                </th>
                {onlineData.map((d) => {
                  const dateBlocks = blockedDates[d.date];
                  const isFullyBlocked = dateBlocks?.all;
                  return (
                    <th
                      key={d.date}
                      className={`p-2 text-center font-medium text-foreground whitespace-nowrap min-w-[60px] bg-muted/50 ${isFullyBlocked ? 'opacity-50' : ''}`}
                    >
                      {formatDate(d.date)}
                      {isFullyBlocked && (
                        <div className="text-xs text-destructive mt-1">
                          <Icon name="Lock" size={12} className="inline" />
                        </div>
                      )}
                    </th>
                  );
                })}
                <th className="p-2 text-center font-semibold text-foreground bg-accent/10 min-w-[80px]">
                  Tokens
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b hover:bg-muted/30">
                <td className="p-2 font-medium sticky left-0 bg-background">
                  Online CB
                </td>
                {onlineData.map((d, idx) => {
                  return (
                    <td key={d.date} className="p-2 text-center">
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={d.cb || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, "");
                          handleCellChange(
                            idx,
                            "cb",
                            val === "" ? 0 : Number(val),
                          );
                        }}
                        className="w-14 h-8 text-center text-xs p-1"
                        disabled={isReadOnly}
                      />
                    </td>
                  );
                })}
                <td className="p-2 text-center"></td>
              </tr>

              <tr className="border-b bg-amber-400/20">
                <td className="p-2 font-medium sticky left-0 bg-amber-400/20">
                  Chaturbate
                </td>
                {onlineData.map((d, idx) => {
                  const dateBlocks = blockedDates[d.date];
                  const isBlocked = dateBlocks?.all || dateBlocks?.chaturbate;
                  return (
                    <td key={d.date} className="p-2 text-center">
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={d.cbIncome || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.]/g, "");
                          handleCellChange(
                            idx,
                            "cbIncome",
                            val === "" ? 0 : Number(val),
                          );
                        }}
                        className="w-14 h-8 text-center text-xs p-1"
                        disabled={isReadOnly || (userRole !== 'director' && isBlocked)}
                      />
                    </td>
                  );
                })}
                <td className="p-2 text-center font-bold bg-amber-400/30">
                  {onlineData
                    .reduce((sum, d) => sum + d.cbIncome, 0)
                    .toFixed(2)}
                </td>
              </tr>

              <tr className="border-b hover:bg-muted/30">
                <td className="p-2 font-medium sticky left-0 bg-background">
                  Online SP
                </td>
                {onlineData.map((d, idx) => {
                  return (
                    <td key={d.date} className="p-2 text-center">
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={d.sp || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, "");
                          handleCellChange(
                            idx,
                            "sp",
                            val === "" ? 0 : Number(val),
                          );
                        }}
                        className="w-14 h-8 text-center text-xs p-1"
                        disabled={isReadOnly}
                      />
                    </td>
                  );
                })}
                <td className="p-2 text-center"></td>
              </tr>

              <tr className="border-b bg-red-500/20">
                <td className="p-2 font-medium sticky left-0 bg-red-500/20">
                  Stripchat
                </td>
                {onlineData.map((d, idx) => {
                  const dateBlocks = blockedDates[d.date];
                  const isBlocked = dateBlocks?.all || dateBlocks?.stripchat;
                  return (
                    <td key={d.date} className="p-2 text-center">
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={d.spIncome || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.]/g, "");
                          handleCellChange(
                            idx,
                            "spIncome",
                            val === "" ? 0 : Number(val),
                          );
                        }}
                        className="w-14 h-8 text-center text-xs p-1"
                        disabled={isReadOnly || (userRole !== 'director' && isBlocked)}
                      />
                    </td>
                  );
                })}
                <td className="p-2 text-center font-bold bg-red-500/30">
                  {onlineData
                    .reduce((sum, d) => sum + d.spIncome, 0)
                    .toFixed(2)}
                </td>
              </tr>

              <tr className="border-b hover:bg-muted/30">
                <td className="p-2 font-medium sticky left-0 bg-background">
                  Переводы
                </td>
                {onlineData.map((d, idx) => {
                  const dateBlocks = blockedDates[d.date];
                  const isBlocked = dateBlocks?.all;
                  return (
                    <td key={d.date} className="p-2 text-center">
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={d.transfers || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.]/g, "");
                          handleCellChange(
                            idx,
                            "transfers",
                            val === "" ? 0 : Number(val),
                          );
                        }}
                        className="w-14 h-8 text-center text-xs p-1"
                        disabled={isReadOnly || (userRole !== 'director' && isBlocked)}
                      />
                    </td>
                  );
                })}
                <td className="p-2 text-center font-bold bg-accent/5">
                  {onlineData
                    .reduce((sum, d) => sum + d.transfers, 0)
                    .toFixed(2)}
                </td>
              </tr>

              <tr className="border-b hover:bg-muted/30">
                <td className="p-2 font-medium sticky left-0 bg-background">
                  Оператор (Имя)
                </td>
                {onlineData.map((d, idx) => (
                  <td key={d.date} className="p-2 text-center">
                    <Select
                      value={d.operator || "none"}
                      onValueChange={(value) =>
                        handleCellChange(
                          idx,
                          "operator",
                          value === "none" ? "" : value,
                        )
                      }
                      disabled={isReadOnly}
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
                <td className="p-2 font-medium sticky left-0 bg-background">
                  Смены
                </td>
                {onlineData.map((d, idx) => (
                  <td key={d.date} className="p-2 text-center">
                    <Checkbox
                      checked={d.shift}
                      onCheckedChange={(checked) =>
                        handleCellChange(idx, "shift", checked === true)
                      }
                      disabled={isReadOnly}
                    />
                  </td>
                ))}
                <td className="p-2 text-center font-bold bg-accent/5">
                  {totalShifts}
                </td>
              </tr>

              <tr className="border-b bg-green-500/10">
                <td className="p-2 font-bold sticky left-0 bg-green-500/10">
                  Income
                </td>
                {onlineData.map((d) => {
                  const dailyIncome =
                    ((d.cbIncome + d.spIncome) * 0.05 +
                      d.transfers) *
                    incomeMultiplier;
                  return (
                    <td
                      key={d.date}
                      className="p-2 text-center font-semibold text-green-600"
                    >
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
              <Badge variant="outline">
                {platform.tokens.toFixed(0)} токенов
              </Badge>
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
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="onlineSP"
              stroke="#ef4444"
              name="Stripchat"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="onlineCB"
              stroke="#f97316"
              name="Chaturbate"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Доходы по дням</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={onlineData.map((d) => ({
              date: formatDate(d.date),
              CB: d.cbIncome * 0.05 * 0.6,
              SP: d.spIncome * 0.05 * 0.6,
              Transfers: d.transfers * 0.6,
            }))}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="date" className="text-xs" />
            <YAxis className="text-xs" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Bar dataKey="CB" fill="#f97316" name="Chaturbate ($)" />
            <Bar dataKey="SP" fill="#ef4444" name="Stripchat ($)" />
            <Bar dataKey="Transfers" fill="#10b981" name="Переводы ($)" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

export default ModelFinances;