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
  onWeekOffsetChange: (offset: number) => void;
  filterTeam: string;
  onFilterTeamChange: (team: string) => void;
  teams: Team[];
  canEdit: boolean;
}

const ScheduleHeader = ({
  currentWeekOffset,
  onWeekOffsetChange,
  filterTeam,
  onFilterTeamChange,
  teams,
  canEdit
}: ScheduleHeaderProps) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <h2 className="text-4xl font-serif font-bold text-foreground mb-2">Расписание</h2>
        <p className="text-muted-foreground">График работы по квартирам</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 border border-border rounded-lg p-1">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onWeekOffsetChange(currentWeekOffset - 1)}
            disabled={currentWeekOffset <= -1}
          >
            <Icon name="ChevronLeft" size={16} />
          </Button>
          <span className="text-sm font-medium px-2 min-w-[120px] text-center">
            {currentWeekOffset === 0 ? 'Эта неделя' : 
             currentWeekOffset === 1 ? 'След. неделя' :
             currentWeekOffset === -1 ? 'Прош. неделя' :
             currentWeekOffset > 0 ? `+${currentWeekOffset} нед.` : `${currentWeekOffset} нед.`}
          </span>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onWeekOffsetChange(currentWeekOffset + 1)}
            disabled={currentWeekOffset >= 1}
          >
            <Icon name="ChevronRight" size={16} />
          </Button>
        </div>
        
        <Select value={filterTeam || "all"} onValueChange={(val) => onFilterTeamChange(val === "all" ? "" : val)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Все команды" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все команды</SelectItem>
            {teams.map((team) => (
              <SelectItem key={team.displayName} value={team.displayName}>
                {team.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {canEdit && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon name="Info" size={16} />
            <span className="hidden lg:inline">Нажмите на ячейку</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleHeader;
