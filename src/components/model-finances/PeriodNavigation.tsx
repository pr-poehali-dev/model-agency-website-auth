import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Period } from '@/utils/periodUtils';

interface PeriodNavigationProps {
  currentPeriod: Period;
  onPreviousPeriod: () => void;
  onNextPeriod: () => void;
}

const PeriodNavigation = ({ currentPeriod, onPreviousPeriod, onNextPeriod }: PeriodNavigationProps) => {
  return (
    <Card className="p-2">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPreviousPeriod}
        >
          <Icon name="ChevronLeft" size={16} />
        </Button>
        <div className="font-semibold text-sm px-2">
          {currentPeriod.label}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onNextPeriod}
        >
          <Icon name="ChevronRight" size={16} />
        </Button>
      </div>
    </Card>
  );
};

export default PeriodNavigation;
