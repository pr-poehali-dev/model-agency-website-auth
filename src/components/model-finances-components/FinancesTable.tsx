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
    { key: 'cb', label: 'Chaturbate', type: 'tokens' },
    { key: 'cbIncome', label: 'Доход CB ($)', type: 'income' },
    { key: 'sp', label: 'Stripchat', type: 'tokens' },
    { key: 'spIncome', label: 'Доход SP ($)', type: 'income' },
    { key: 'soda', label: 'CamSoda', type: 'tokens' },
    { key: 'sodaIncome', label: 'Доход Soda ($)', type: 'income' },
    { key: 'stripchatTokens', label: 'SP токены', type: 'tokens' },
    { key: 'transfers', label: 'Переводы ($)', type: 'income' },
  ];

  return (
    <Card className="p-6">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="p-2 text-left font-medium text-foreground sticky left-0 bg-background z-10 min-w-[120px]">
                Показатель
              </th>
              {onlineData.map((day) => {
                const weekend = isWeekend(day.date);
                return (
                  <th
                    key={day.date}
                    className={`p-2 text-center font-medium text-foreground min-w-[80px] ${weekend ? "bg-muted/20" : ""}`}
                  >
                    <div className="flex flex-col">
                      <span>{formatDate(day.date)}</span>
                      <span className="text-xs text-muted-foreground font-normal">
                        {getDayName(day.date)}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {fields.map((field) => (
              <tr key={field.key} className="border-b border-border hover:bg-muted/30">
                <td className="p-2 font-medium sticky left-0 bg-background z-10">
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

                  return (
                    <td key={day.date} className={`p-2 ${weekend ? "bg-muted/20" : ""}`}>
                      <Input
                        type="number"
                        value={(day as any)[field.key]}
                        onChange={(e) => onInputChange(day.date, field.key, e.target.value)}
                        className={`text-center w-full ${isBlocked ? "bg-red-500/10 border-red-500/50" : ""}`}
                        disabled={isReadOnly || isBlocked}
                        min="0"
                        step={field.type === 'income' ? '0.01' : '1'}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
            
            {!isSoloMaker && (
              <>
                <tr className="border-b border-border hover:bg-muted/30">
                  <td className="p-2 font-medium sticky left-0 bg-background z-10">
                    Оператор
                  </td>
                  {onlineData.map((day) => {
                    const weekend = isWeekend(day.date);
                    return (
                      <td key={day.date} className={`p-2 ${weekend ? "bg-muted/20" : ""}`}>
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
                
                <tr className="border-b border-border hover:bg-muted/30">
                  <td className="p-2 font-medium sticky left-0 bg-background z-10">
                    Смена
                  </td>
                  {onlineData.map((day) => {
                    const weekend = isWeekend(day.date);
                    return (
                      <td key={day.date} className={`p-2 text-center ${weekend ? "bg-muted/20" : ""}`}>
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
