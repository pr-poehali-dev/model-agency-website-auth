import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DayData, OperatorInfo } from './types';
import { formatDate } from './utils';

interface FinancialTableProps {
  onlineData: DayData[];
  operators: OperatorInfo[];
  isReadOnly: boolean;
  onCellChange: (index: number, field: keyof DayData, value: string | number | boolean) => void;
}

const FinancialTable = ({ onlineData, operators, isReadOnly, onCellChange }: FinancialTableProps) => {
  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="p-3 text-left font-semibold whitespace-nowrap">Дата</th>
            <th className="p-3 text-center font-semibold whitespace-nowrap">Online CB</th>
            <th className="p-3 text-center font-semibold whitespace-nowrap">CB</th>
            <th className="p-3 text-center font-semibold whitespace-nowrap">Online SP</th>
            <th className="p-3 text-center font-semibold whitespace-nowrap">SP</th>
            <th className="p-3 text-center font-semibold whitespace-nowrap">Online Soda</th>
            <th className="p-3 text-center font-semibold whitespace-nowrap">CamSoda</th>
            <th className="p-3 text-center font-semibold whitespace-nowrap">Cam4</th>
            <th className="p-3 text-center font-semibold whitespace-nowrap">Переводы</th>
            <th className="p-3 text-center font-semibold whitespace-nowrap">Оператор</th>
            <th className="p-3 text-center font-semibold whitespace-nowrap">Смена</th>
          </tr>
        </thead>
        <tbody>
          {onlineData.map((day, index) => (
            <tr key={day.date} className="border-b hover:bg-muted/30 transition-colors">
              <td className="p-3 font-medium whitespace-nowrap">
                {formatDate(day.date)}
              </td>
              <td className="p-2">
                <Input
                  type="number"
                  value={day.onlineCB || ''}
                  onChange={(e) => onCellChange(index, 'onlineCB', parseFloat(e.target.value) || 0)}
                  className="h-9 text-center"
                  placeholder="0"
                  disabled={isReadOnly}
                />
              </td>
              <td className="p-2">
                <Input
                  type="number"
                  value={day.chaturbate || ''}
                  onChange={(e) => onCellChange(index, 'chaturbate', parseFloat(e.target.value) || 0)}
                  className="h-9 text-center"
                  placeholder="0"
                  disabled={isReadOnly}
                />
              </td>
              <td className="p-2">
                <Input
                  type="number"
                  value={day.onlineSP || ''}
                  onChange={(e) => onCellChange(index, 'onlineSP', parseFloat(e.target.value) || 0)}
                  className="h-9 text-center"
                  placeholder="0"
                  disabled={isReadOnly}
                />
              </td>
              <td className="p-2">
                <Input
                  type="number"
                  value={day.stripchat || ''}
                  onChange={(e) => onCellChange(index, 'stripchat', parseFloat(e.target.value) || 0)}
                  className="h-9 text-center"
                  placeholder="0"
                  disabled={isReadOnly}
                />
              </td>
              <td className="p-2">
                <Input
                  type="number"
                  value={day.onlineSoda || ''}
                  onChange={(e) => onCellChange(index, 'onlineSoda', parseFloat(e.target.value) || 0)}
                  className="h-9 text-center"
                  placeholder="0"
                  disabled={isReadOnly}
                />
              </td>
              <td className="p-2">
                <Input
                  type="number"
                  value={day.camSoda || ''}
                  onChange={(e) => onCellChange(index, 'camSoda', parseFloat(e.target.value) || 0)}
                  className="h-9 text-center"
                  placeholder="0"
                  disabled={isReadOnly}
                />
              </td>
              <td className="p-2">
                <Input
                  type="number"
                  value={day.cam4 || ''}
                  onChange={(e) => onCellChange(index, 'cam4', parseFloat(e.target.value) || 0)}
                  className="h-9 text-center"
                  placeholder="0"
                  disabled={isReadOnly}
                />
              </td>
              <td className="p-2">
                <Input
                  type="number"
                  value={day.transfers || ''}
                  onChange={(e) => onCellChange(index, 'transfers', parseFloat(e.target.value) || 0)}
                  className="h-9 text-center"
                  placeholder="0"
                  disabled={isReadOnly}
                />
              </td>
              <td className="p-2">
                <Select
                  value={day.operator}
                  onValueChange={(value) => onCellChange(index, 'operator', value)}
                  disabled={isReadOnly}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Выберите" />
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
              <td className="p-3 text-center">
                <Checkbox
                  checked={day.isShift}
                  onCheckedChange={(checked) => onCellChange(index, 'isShift', checked === true)}
                  disabled={isReadOnly}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FinancialTable;