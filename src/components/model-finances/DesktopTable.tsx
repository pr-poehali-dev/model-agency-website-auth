import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DayData, OperatorInfo } from './types';
import { calculateDailyIncome, formatDate } from './utils';

interface DesktopTableProps {
  onlineData: DayData[];
  operators: OperatorInfo[];
  isReadOnly: boolean;
  onCellChange: (index: number, field: keyof DayData, value: string | number | boolean) => void;
}

const DesktopTable = ({ onlineData, operators, isReadOnly, onCellChange }: DesktopTableProps) => {
  return (
    <div className="hidden lg:block">
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium sticky left-0 bg-muted/50 z-10">Дата</th>
                <th className="text-right p-3 font-medium">CB $</th>
                <th className="text-right p-3 font-medium">SP $</th>
                <th className="text-right p-3 font-medium">Soda $</th>
                <th className="text-right p-3 font-medium">Cam4 $</th>
                <th className="text-right p-3 font-medium">Переводы $</th>
                <th className="text-center p-3 font-medium">Оператор</th>
                <th className="text-center p-3 font-medium">Смена</th>
                <th className="text-right p-3 font-medium bg-primary/5">Доход $</th>
              </tr>
            </thead>
            <tbody>
              {onlineData.map((d, idx) => {
                const dailyIncome = calculateDailyIncome(d);
                return (
                  <tr
                    key={d.date}
                    className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${
                      d.shift ? 'bg-green-500/5' : ''
                    }`}
                  >
                    <td className="p-2 font-medium sticky left-0 bg-background z-10">
                      {formatDate(d.date)}
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        value={d.cbIncome || ''}
                        onChange={(e) => onCellChange(idx, 'cbIncome', Number(e.target.value))}
                        className="w-24 h-9 text-right"
                        disabled={isReadOnly}
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        value={d.spIncome || ''}
                        onChange={(e) => onCellChange(idx, 'spIncome', Number(e.target.value))}
                        className="w-24 h-9 text-right"
                        disabled={isReadOnly}
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        value={d.sodaIncome || ''}
                        onChange={(e) => onCellChange(idx, 'sodaIncome', Number(e.target.value))}
                        className="w-24 h-9 text-right"
                        disabled={isReadOnly}
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        value={d.cam4 || ''}
                        onChange={(e) => onCellChange(idx, 'cam4', Number(e.target.value))}
                        className="w-24 h-9 text-right"
                        disabled={isReadOnly}
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        value={d.transfers || ''}
                        onChange={(e) => onCellChange(idx, 'transfers', Number(e.target.value))}
                        className="w-24 h-9 text-right"
                        disabled={isReadOnly}
                      />
                    </td>
                    <td className="p-2">
                      <Select
                        value={d.operator}
                        onValueChange={(value) => onCellChange(idx, 'operator', value)}
                        disabled={isReadOnly}
                      >
                        <SelectTrigger className="w-32 h-9">
                          <SelectValue placeholder="-" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">-</SelectItem>
                          {operators.map(op => (
                            <SelectItem key={op.email} value={op.name}>{op.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-2 text-center">
                      <Checkbox
                        checked={d.shift}
                        onCheckedChange={(checked) => onCellChange(idx, 'shift', checked as boolean)}
                        disabled={isReadOnly}
                        className="mx-auto"
                      />
                    </td>
                    <td className="p-2 text-right font-semibold bg-primary/5">
                      {dailyIncome.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default DesktopTable;
