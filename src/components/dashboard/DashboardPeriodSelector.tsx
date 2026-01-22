import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Period } from '@/utils/periodUtils';

interface DashboardPeriodSelectorProps {
  currentPeriod: Period;
  onPreviousPeriod: () => void;
  onNextPeriod: () => void;
}

const DashboardPeriodSelector = ({
  currentPeriod,
  onPreviousPeriod,
  onNextPeriod
}: DashboardPeriodSelectorProps) => {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon name="Calendar" size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Расчётный период</h2>
            <p className="text-sm text-muted-foreground">Данные за выбранный период</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPreviousPeriod}
            className="h-9 w-9 p-0"
          >
            <Icon name="ChevronLeft" size={16} />
          </Button>
          
          <div className="min-w-[200px] text-center px-4">
            <p className="text-sm font-medium text-foreground">{currentPeriod.label}</p>
            <p className="text-xs text-muted-foreground">
              {currentPeriod.startDate.toLocaleDateString('ru-RU')} - {currentPeriod.endDate.toLocaleDateString('ru-RU')}
            </p>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onNextPeriod}
            className="h-9 w-9 p-0"
          >
            <Icon name="ChevronRight" size={16} />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default DashboardPeriodSelector;
