import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

interface FinancesTableProps {
  onlineData: DayData[];
  operators: Array<{ email: string; name: string }>;
  isReadOnly: boolean;
  isSoloMaker: boolean;
  blockedDates: Record<string, { all?: boolean; chaturbate?: boolean; stripchat?: boolean }>;
  onInputChange: (date: string, field: string, value: string) => void;
  onShiftChange: (date: string, checked: boolean) => void;
  onOperatorChange: (date: string, value: string) => void;
}

const FinancesTable = ({
  onlineData,
  operators,
  isReadOnly,
  isSoloMaker,
  blockedDates,
  onInputChange,
  onShiftChange,
  onOperatorChange,
}: FinancesTableProps) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${day}.${month}`;
  };

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
    return days[date.getDay()];
  };

  const isWeekend = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const fields = [
    { key: 'cb', label: 'Online CB', type: 'online', platform: 'chaturbate' },
    { key: 'cbTokens', label: 'Chaturbate (токены)', type: 'tokens', platform: 'chaturbate' },
    { key: 'cbIncome', label: 'Chaturbate ($)', type: 'calculated', platform: 'chaturbate', tokenKey: 'cbTokens' },
    { key: 'sp', label: 'Online SP', type: 'online', platform: 'stripchat' },
    { key: 'spTokens', label: 'Stripchat (токены)', type: 'tokens', platform: 'stripchat' },
    { key: 'spIncome', label: 'Stripchat ($)', type: 'calculated', platform: 'stripchat', tokenKey: 'spTokens' },
    { key: 'soda', label: 'Online Soda', type: 'online', platform: 'camsoda' },
    { key: 'sodaTokens', label: 'CamSoda (токены)', type: 'tokens', platform: 'camsoda' },
    { key: 'sodaIncome', label: 'CamSoda ($)', type: 'calculated', platform: 'camsoda', tokenKey: 'sodaTokens' },
    { key: 'transfers', label: 'Переводы ($)', type: 'income', platform: 'none' },
  ];

  return (
    <Card className="p-6 shadow-lg border-2">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-separate border-spacing-0">
          <thead>
            <tr className="border-b-2 border-border">
              <th className="p-3 text-left font-semibold text-foreground sticky left-0 bg-gradient-to-r from-background to-muted/30 z-10 min-w-[140px] border-b-2 border-r-2 border-border">
                Показатель
              </th>
              {onlineData.map((day) => {
                const weekend = isWeekend(day.date);
                return (
                  <th
                    key={day.date}
                    className={`p-3 text-center font-semibold text-foreground min-w-[90px] border-b-2 border-r border-border transition-colors ${
                      weekend ? "bg-gradient-to-b from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/30" : "bg-gradient-to-b from-background to-muted/20"
                    }`}
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-base font-bold">{formatDate(day.date)}</span>
                      <span className="text-xs text-muted-foreground font-medium">
                        {getDayName(day.date)}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {fields.map((field) => {
              const getPlatformBg = (platform: string) => {
                if (platform === 'chaturbate') return 'bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20';
                if (platform === 'stripchat') return 'bg-gradient-to-r from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20';
                if (platform === 'camsoda') return 'bg-gradient-to-r from-cyan-50 to-cyan-100/50 dark:from-cyan-950/30 dark:to-cyan-900/20';
                return 'bg-gradient-to-r from-background to-muted/30';
              };
              
              return (
                <tr key={field.key} className="border-b border-border hover:bg-muted/40 transition-colors">
                  <td className={`p-3 font-semibold sticky left-0 z-10 border-r-2 border-border ${getPlatformBg((field as any).platform)}`}>
                    {field.label}
                  </td>
                  {onlineData.map((day) => {
                    const dateBlocked = blockedDates[day.date];
                    const cbBlocked = dateBlocked?.all || dateBlocked?.chaturbate;
                    const spBlocked = dateBlocked?.all || dateBlocked?.stripchat;
                    const sodaBlocked = dateBlocked?.all;
                    const weekend = isWeekend(day.date);
                    
                    let isBlocked = false;
                    if (field.key === 'cb') isBlocked = cbBlocked || false;
                    if (field.key === 'sp') isBlocked = spBlocked || false;
                    if (field.key === 'soda') isBlocked = sodaBlocked || false;

                    const getCellBg = () => {
                      if (weekend) return 'bg-amber-50/50 dark:bg-amber-950/10';
                      return '';
                    };

                    const isCalculatedField = field.type === 'calculated';
                    const tokenKey = (field as any).tokenKey;
                    const calculatedValue = isCalculatedField && tokenKey 
                      ? ((day as any)[tokenKey] * 0.05 * 0.6).toFixed(2)
                      : (day as any)[field.key];

                    return (
                      <td key={day.date} className={`p-2 border-r border-border ${getCellBg()}`}>
                        {isCalculatedField ? (
                          <div className="text-center py-2 font-semibold text-foreground">
                            ${calculatedValue}
                          </div>
                        ) : (
                          <Input
                            type="number"
                            value={(day as any)[field.key]}
                            onChange={(e) => onInputChange(day.date, field.key, e.target.value)}
                            className={`text-center w-full font-medium transition-all ${
                              isBlocked 
                                ? "bg-red-500/10 border-red-500/50" 
                                : ""
                            }`}
                            disabled={isReadOnly || isBlocked}
                            min="0"
                            step={field.type === 'income' ? '0.01' : '1'}
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            
            {!isSoloMaker && (
              <>
                <tr className="border-b border-border hover:bg-muted/40 transition-colors bg-gradient-to-r from-purple-50/50 to-background dark:from-purple-950/20 dark:to-background">
                  <td className="p-3 font-semibold sticky left-0 bg-gradient-to-r from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 z-10 border-r-2 border-border">
                    Оператор
                  </td>
                  {onlineData.map((day) => {
                    const weekend = isWeekend(day.date);
                    return (
                      <td key={day.date} className={`p-2 border-r border-border ${weekend ? "bg-amber-50/50 dark:bg-amber-950/10" : ""}`}>
                        <Select
                          value={day.operator || "none"}
                          onValueChange={(value) => onOperatorChange(day.date, value === "none" ? "" : value)}
                          disabled={isReadOnly}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Не выбран" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Не выбран</SelectItem>
                            {operators.map((op) => (
                              <SelectItem key={op.email} value={op.email}>
                                {op.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    );
                  })}
                </tr>
                
                <tr className="border-b border-border hover:bg-muted/40 transition-colors bg-gradient-to-r from-green-50/50 to-background dark:from-green-950/20 dark:to-background">
                  <td className="p-3 font-semibold sticky left-0 bg-gradient-to-r from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 z-10 border-r-2 border-border">
                    Смена
                  </td>
                  {onlineData.map((day) => {
                    const weekend = isWeekend(day.date);
                    return (
                      <td key={day.date} className={`p-2 text-center border-r border-border ${weekend ? "bg-amber-50/50 dark:bg-amber-950/10" : ""}`}>
                        <div className="flex justify-center">
                          <Checkbox
                            checked={day.shift}
                            onCheckedChange={(checked) =>
                              onShiftChange(day.date, checked === true)
                            }
                            disabled={isReadOnly}
                          />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default FinancesTable;