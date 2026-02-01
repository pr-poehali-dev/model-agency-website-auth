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

  return (
    <Card className="p-6">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="p-2 text-left font-medium text-foreground sticky left-0 bg-background z-10">
                Дата
              </th>
              <th className="p-2 text-center font-medium text-foreground">
                Chaturbate
              </th>
              <th className="p-2 text-center font-medium text-foreground">
                Доход CB ($)
              </th>
              <th className="p-2 text-center font-medium text-foreground">
                Stripchat
              </th>
              <th className="p-2 text-center font-medium text-foreground">
                Доход SP ($)
              </th>
              <th className="p-2 text-center font-medium text-foreground">
                CamSoda
              </th>
              <th className="p-2 text-center font-medium text-foreground">
                Доход Soda ($)
              </th>
              <th className="p-2 text-center font-medium text-foreground">
                SP токены
              </th>
              <th className="p-2 text-center font-medium text-foreground">
                Переводы ($)
              </th>
              {!isSoloMaker && (
                <>
                  <th className="p-2 text-center font-medium text-foreground">
                    Оператор
                  </th>
                  <th className="p-2 text-center font-medium text-foreground">
                    Смена
                  </th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {onlineData.map((day) => {
              const dateBlocked = blockedDates[day.date];
              const cbBlocked = dateBlocked?.all || dateBlocked?.chaturbate;
              const spBlocked = dateBlocked?.all || dateBlocked?.stripchat;
              const sodaBlocked = dateBlocked?.all;
              const weekend = isWeekend(day.date);

              return (
                <tr
                  key={day.date}
                  className={`border-b border-border hover:bg-muted/30 ${weekend ? "bg-muted/20" : ""}`}
                >
                  <td className="p-2 font-medium sticky left-0 bg-background z-10">
                    <div className="flex flex-col">
                      <span>{formatDate(day.date)}</span>
                      <span className="text-xs text-muted-foreground">
                        {getDayName(day.date)}
                      </span>
                    </div>
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      value={day.cb}
                      onChange={(e) => onInputChange(day.date, "cb", e.target.value)}
                      className={`text-center ${cbBlocked ? "bg-red-500/10 border-red-500/50" : ""}`}
                      disabled={isReadOnly || cbBlocked}
                      min="0"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      value={day.cbIncome}
                      onChange={(e) => onInputChange(day.date, "cbIncome", e.target.value)}
                      className="text-center"
                      disabled={isReadOnly}
                      min="0"
                      step="0.01"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      value={day.sp}
                      onChange={(e) => onInputChange(day.date, "sp", e.target.value)}
                      className={`text-center ${spBlocked ? "bg-red-500/10 border-red-500/50" : ""}`}
                      disabled={isReadOnly || spBlocked}
                      min="0"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      value={day.spIncome}
                      onChange={(e) => onInputChange(day.date, "spIncome", e.target.value)}
                      className="text-center"
                      disabled={isReadOnly}
                      min="0"
                      step="0.01"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      value={day.soda}
                      onChange={(e) => onInputChange(day.date, "soda", e.target.value)}
                      className={`text-center ${sodaBlocked ? "bg-red-500/10 border-red-500/50" : ""}`}
                      disabled={isReadOnly || sodaBlocked}
                      min="0"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      value={day.sodaIncome}
                      onChange={(e) => onInputChange(day.date, "sodaIncome", e.target.value)}
                      className="text-center"
                      disabled={isReadOnly}
                      min="0"
                      step="0.01"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      value={day.stripchatTokens}
                      onChange={(e) => onInputChange(day.date, "stripchatTokens", e.target.value)}
                      className="text-center"
                      disabled={isReadOnly}
                      min="0"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="number"
                      value={day.transfers}
                      onChange={(e) => onInputChange(day.date, "transfers", e.target.value)}
                      className="text-center"
                      disabled={isReadOnly}
                      min="0"
                      step="0.01"
                    />
                  </td>
                  {!isSoloMaker && (
                    <>
                      <td className="p-2">
                        <Select
                          value={day.operator}
                          onValueChange={(value) => onOperatorChange(day.date, value)}
                          disabled={isReadOnly}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Не выбран" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Не выбран</SelectItem>
                            {operators.map((op) => (
                              <SelectItem key={op.email} value={op.email}>
                                {op.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-2 text-center">
                        <Checkbox
                          checked={day.shift}
                          onCheckedChange={(checked) =>
                            onShiftChange(day.date, checked === true)
                          }
                          disabled={isReadOnly}
                        />
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default FinancesTable;
