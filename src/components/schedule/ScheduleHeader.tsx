import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Icon from '@/components/ui/icon';

interface Team {
  operatorEmail: string;
  operatorName: string;
  modelEmail: string;
  modelName: string;
  displayName: string;
}

interface ScheduleHeaderProps {
  currentWeekOffset: number;
  onWeekChange: (offset: number) => void;
  filterTeam: string;
  onFilterChange: (value: string) => void;
  teams: Team[];
  canEdit: boolean;
  onManageTeams: () => void;
}

const ScheduleHeader = ({
  currentWeekOffset,
  onWeekChange,
  filterTeam,
  onFilterChange,
  teams,
  canEdit,
  onManageTeams
}: ScheduleHeaderProps) => {
  const getWeekLabel = (offset: number) => {
    if (offset === 0) return 'Текущая неделя';
    if (offset === -1) return 'Прошлая неделя';
    if (offset === 1) return 'Следующая неделя';
    if (offset < 0) return `${Math.abs(offset)} недели назад`;
    return `Через ${offset} недели`;
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onWeekChange(currentWeekOffset - 1)}
        >
          <Icon name="ChevronLeft" size={16} />
        </Button>
        <span className="text-sm font-medium min-w-[150px] text-center">
          {getWeekLabel(currentWeekOffset)}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onWeekChange(currentWeekOffset + 1)}
        >
          <Icon name="ChevronRight" size={16} />
        </Button>
        {currentWeekOffset !== 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onWeekChange(0)}
          >
            Сегодня
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Select value={filterTeam} onValueChange={onFilterChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Все команды" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все команды</SelectItem>
            {teams.map((team, idx) => (
              <SelectItem key={idx} value={team.displayName}>
                {team.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {canEdit && (
          <Button variant="outline" size="sm" onClick={onManageTeams}>
            <Icon name="Users" size={16} className="mr-2" />
            Команды
          </Button>
        )}
      </div>
    </div>
  );
};

export default ScheduleHeader;
