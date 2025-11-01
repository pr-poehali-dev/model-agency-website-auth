import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DayData, OperatorInfo } from './types';
import { formatDate, calculateDailyIncome } from './utils';

interface FinancialTableProps {
  onlineData: DayData[];
  operators: OperatorInfo[];
  isReadOnly: boolean;
  onCellChange: (index: number, field: keyof DayData, value: string | number | boolean) => void;
}

const FinancialTable = ({ onlineData, operators, isReadOnly, onCellChange }: FinancialTableProps) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border border-border bg-muted/50 p-3 text-left font-semibold sticky left-0 z-20">
              Настоящий период
            </th>
            {onlineData.map((day, index) => (
              <th 
                key={day.date} 
                className="border border-border bg-muted/50 p-3 text-center font-medium whitespace-nowrap min-w-[80px]"
              >
                {formatDate(day.date)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-border bg-card p-3 font-medium sticky left-0 z-10">Online CB</td>
            {onlineData.map((day, index) => (
              <td key={day.date} className="border border-border bg-card p-2">
                <Input
                  type="number"
                  value={day.onlineCB || ''}
                  onChange={(e) => onCellChange(index, 'onlineCB', parseFloat(e.target.value) || 0)}
                  className="h-9 text-center bg-background/50 border-0"
                  placeholder="0"
                  disabled={isReadOnly}
                />
              </td>
            ))}
          </tr>

          <tr>
            <td className="border border-border bg-card p-3 font-medium sticky left-0 z-10">Chaturbate</td>
            {onlineData.map((day, index) => (
              <td key={day.date} className="border border-border bg-card p-2">
                <Input
                  type="number"
                  value={day.chaturbate || ''}
                  onChange={(e) => onCellChange(index, 'chaturbate', parseFloat(e.target.value) || 0)}
                  className="h-9 text-center bg-background/50 border-0"
                  placeholder="0"
                  disabled={isReadOnly}
                />
              </td>
            ))}
          </tr>

          <tr>
            <td className="border border-border bg-card p-3 font-medium sticky left-0 z-10">Online SP</td>
            {onlineData.map((day, index) => (
              <td key={day.date} className="border border-border bg-card p-2">
                <Input
                  type="number"
                  value={day.onlineSP || ''}
                  onChange={(e) => onCellChange(index, 'onlineSP', parseFloat(e.target.value) || 0)}
                  className="h-9 text-center bg-background/50 border-0"
                  placeholder="0"
                  disabled={isReadOnly}
                />
              </td>
            ))}
          </tr>

          <tr>
            <td className="border border-border bg-card p-3 font-medium sticky left-0 z-10">Stripchat</td>
            {onlineData.map((day, index) => (
              <td key={day.date} className="border border-border bg-card p-2">
                <Input
                  type="number"
                  value={day.stripchat || ''}
                  onChange={(e) => onCellChange(index, 'stripchat', parseFloat(e.target.value) || 0)}
                  className="h-9 text-center bg-background/50 border-0"
                  placeholder="0"
                  disabled={isReadOnly}
                />
              </td>
            ))}
          </tr>

          <tr>
            <td className="border border-border bg-card p-3 font-medium sticky left-0 z-10">Online Soda</td>
            {onlineData.map((day, index) => (
              <td key={day.date} className="border border-border bg-card p-2">
                <Input
                  type="number"
                  value={day.onlineSoda || ''}
                  onChange={(e) => onCellChange(index, 'onlineSoda', parseFloat(e.target.value) || 0)}
                  className="h-9 text-center bg-background/50 border-0"
                  placeholder="0"
                  disabled={isReadOnly}
                />
              </td>
            ))}
          </tr>

          <tr>
            <td className="border border-border bg-card p-3 font-medium sticky left-0 z-10">CamSoda</td>
            {onlineData.map((day, index) => (
              <td key={day.date} className="border border-border bg-card p-2">
                <Input
                  type="number"
                  value={day.camSoda || ''}
                  onChange={(e) => onCellChange(index, 'camSoda', parseFloat(e.target.value) || 0)}
                  className="h-9 text-center bg-background/50 border-0"
                  placeholder="0"
                  disabled={isReadOnly}
                />
              </td>
            ))}
          </tr>

          <tr>
            <td className="border border-border bg-card p-3 font-medium sticky left-0 z-10">Cam4</td>
            {onlineData.map((day, index) => (
              <td key={day.date} className="border border-border bg-card p-2">
                <Input
                  type="number"
                  value={day.cam4 || ''}
                  onChange={(e) => onCellChange(index, 'cam4', parseFloat(e.target.value) || 0)}
                  className="h-9 text-center bg-background/50 border-0"
                  placeholder="0"
                  disabled={isReadOnly}
                />
              </td>
            ))}
          </tr>

          <tr>
            <td className="border border-border bg-card p-3 font-medium sticky left-0 z-10">Переводы</td>
            {onlineData.map((day, index) => (
              <td key={day.date} className="border border-border bg-card p-2">
                <Input
                  type="number"
                  value={day.transfers || ''}
                  onChange={(e) => onCellChange(index, 'transfers', parseFloat(e.target.value) || 0)}
                  className="h-9 text-center bg-background/50 border-0"
                  placeholder="0"
                  disabled={isReadOnly}
                />
              </td>
            ))}
          </tr>

          <tr>
            <td className="border border-border bg-card p-3 font-medium sticky left-0 z-10">Оператор (имя)</td>
            {onlineData.map((day, index) => (
              <td key={day.date} className="border border-border bg-card p-2">
                <Select
                  value={day.operator}
                  onValueChange={(value) => onCellChange(index, 'operator', value)}
                  disabled={isReadOnly}
                >
                  <SelectTrigger className="h-9 bg-background/50 border-0">
                    <SelectValue placeholder="Не..." />
                  </SelectTrigger>
                  <SelectContent>
                    {operators.map((op) => (
                      <SelectItem key={op.email} value={op.email}>
                        {op.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </td>
            ))}
          </tr>

          <tr>
            <td className="border border-border bg-card p-3 font-medium sticky left-0 z-10">Смены</td>
            {onlineData.map((day, index) => (
              <td key={day.date} className="border border-border bg-card p-3 text-center">
                <Checkbox
                  checked={day.isShift}
                  onCheckedChange={(checked) => onCellChange(index, 'isShift', checked === true)}
                  disabled={isReadOnly}
                />
              </td>
            ))}
          </tr>

          <tr className="bg-muted/30">
            <td className="border border-border p-3 font-semibold sticky left-0 z-10 bg-muted/30">Income</td>
            {onlineData.map((day) => (
              <td key={day.date} className="border border-border p-3 text-center font-semibold text-green-600">
                ${calculateDailyIncome(day).toFixed(2)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default FinancialTable;
