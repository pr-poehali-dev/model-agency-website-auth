import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { getCurrentWeekNumber } from './utils';

interface WeekNavigationProps {
  currentWeekOffset: number;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onCurrentWeek: () => void;
}

const WeekNavigation = ({
  currentWeekOffset,
  onPrevWeek,
  onNextWeek,
  onCurrentWeek
}: WeekNavigationProps) => {
  const currentWeekNum = getCurrentWeekNumber();
  const displayWeekNum = currentWeekNum + currentWeekOffset;

  return (
    <div className="flex items-center gap-2 mb-4">
      <Button onClick={onPrevWeek} variant="outline" size="sm">
        <Icon name="ChevronLeft" size={16} />
      </Button>
      <div className="text-sm font-medium px-4">
        Неделя {displayWeekNum}
        {currentWeekOffset === 0 && ' (текущая)'}
      </div>
      <Button onClick={onNextWeek} variant="outline" size="sm">
        <Icon name="ChevronRight" size={16} />
      </Button>
      {currentWeekOffset !== 0 && (
        <Button onClick={onCurrentWeek} variant="outline" size="sm">
          Текущая неделя
        </Button>
      )}
    </div>
  );
};

export default WeekNavigation;
