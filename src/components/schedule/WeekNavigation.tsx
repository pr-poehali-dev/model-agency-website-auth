import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface WeekNavigationProps {
  currentWeekOffset: number;
  onPrevious: () => void;
  onNext: () => void;
  weekDates: Array<{ day: string; date: string }>;
}

export const WeekNavigation = ({
  currentWeekOffset,
  onPrevious,
  onNext,
  weekDates
}: WeekNavigationProps) => {
  return (
    <div className="flex items-center gap-2 border border-border rounded-lg p-1">
      <Button 
        variant="ghost" 
        size="sm"
        onClick={onPrevious}
        disabled={currentWeekOffset <= -1}
      >
        <Icon name="ChevronLeft" size={16} />
      </Button>
      <span className="text-sm font-medium px-2 min-w-[160px] text-center">
        {weekDates[0]?.date} - {weekDates[6]?.date}
      </span>
      <Button 
        variant="ghost" 
        size="sm"
        onClick={onNext}
        disabled={currentWeekOffset >= 1}
      >
        <Icon name="ChevronRight" size={16} />
      </Button>
    </div>
  );
};