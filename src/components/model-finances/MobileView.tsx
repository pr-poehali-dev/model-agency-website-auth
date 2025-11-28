import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DayData, OperatorInfo } from './types';
import { calculateDailyIncome, calculateTotalIncome, formatDate } from './utils';

interface MobileViewProps {
  onlineData: DayData[];
  operators: OperatorInfo[];
  isReadOnly: boolean;
  onCellChange: (index: number, field: keyof DayData, value: string | number | boolean) => void;
}

const MobileView = ({ onlineData, operators, isReadOnly, onCellChange }: MobileViewProps) => {
  const totalIncome = calculateTotalIncome(onlineData);

  return (
    <div className="lg:hidden space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">По дням</h3>
          <Badge>{totalIncome.toFixed(0)}$</Badge>
        </div>
        {onlineData.map((d, idx) => (
          <div key={d.date} className="border-b last:border-0 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{formatDate(d.date)}</span>
              <Badge variant={d.shift ? "default" : "outline"}>
                {calculateDailyIncome(d).toFixed(2)}$
              </Badge>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">CB:</span>
                <Input
                  type="number"
                  value={d.cbIncome || ''}
                  onChange={(e) => onCellChange(idx, 'cbIncome', Number(e.target.value))}
                  className="w-24 h-8 text-right"
                  disabled={isReadOnly}
                />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">SP:</span>
                <Input
                  type="number"
                  value={d.spIncome || ''}
                  onChange={(e) => onCellChange(idx, 'spIncome', Number(e.target.value))}
                  className="w-24 h-8 text-right"
                  disabled={isReadOnly}
                />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Soda:</span>
                <Input
                  type="number"
                  value={d.sodaIncome || ''}
                  onChange={(e) => onCellChange(idx, 'sodaIncome', Number(e.target.value))}
                  className="w-24 h-8 text-right"
                  disabled={isReadOnly}
                />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Оператор:</span>
                <Select
                  value={d.operator}
                  onValueChange={(value) => onCellChange(idx, 'operator', value)}
                  disabled={isReadOnly}
                >
                  <SelectTrigger className="w-32 h-8">
                    <SelectValue placeholder="-" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">-</SelectItem>
                    {operators.map(op => (
                      <SelectItem key={op.email} value={op.name}>{op.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Смена:</span>
                <Checkbox
                  checked={d.shift}
                  onCheckedChange={(checked) => onCellChange(idx, 'shift', checked as boolean)}
                  disabled={isReadOnly}
                />
              </div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
};

export default MobileView;