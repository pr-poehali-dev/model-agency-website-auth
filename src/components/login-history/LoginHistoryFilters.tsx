import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Icon from '@/components/ui/icon';

export interface UserOption {
  email: string;
  fullName?: string | null;
}

interface LoginHistoryFiltersProps {
  users: UserOption[];
  selectedEmail: string;
  dateFrom: string;
  dateTo: string;
  onEmailChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onReset: () => void;
}

const LoginHistoryFilters = ({
  users,
  selectedEmail,
  dateFrom,
  dateTo,
  onEmailChange,
  onDateFromChange,
  onDateToChange,
  onReset,
}: LoginHistoryFiltersProps) => {
  return (
    <Card className="p-4">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="space-y-2">
          <Label>Сотрудник</Label>
          <Select value={selectedEmail} onValueChange={onEmailChange}>
            <SelectTrigger>
              <SelectValue placeholder="Все сотрудники" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все сотрудники</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.email} value={u.email}>
                  {u.fullName ? `${u.fullName} (${u.email})` : u.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Дата с</Label>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Дата по</Label>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
          />
        </div>

        <div className="flex items-end">
          <Button variant="outline" onClick={onReset} className="w-full gap-2">
            <Icon name="RotateCcw" size={16} />
            Сбросить
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default LoginHistoryFilters;
