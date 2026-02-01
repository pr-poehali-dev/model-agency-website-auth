import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Period, getPreviousPeriod, getNextPeriod } from '@/utils/periodUtils';

interface ChecksHeaderProps {
  currentPeriod: Period;
  onPeriodChange: (period: Period) => void;
  totalModelSum: number;
  totalOperatorSum: number;
  totalSoloMakerSum: number;
  userRole: string | null;
  soloMakersCount: number;
}

const ChecksHeader = ({
  currentPeriod,
  onPeriodChange,
  totalModelSum,
  totalOperatorSum,
  totalSoloMakerSum,
  userRole,
  soloMakersCount
}: ChecksHeaderProps) => {
  const handlePreviousPeriod = () => {
    onPeriodChange(getPreviousPeriod(currentPeriod));
  };

  const handleNextPeriod = () => {
    onPeriodChange(getNextPeriod(currentPeriod));
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-serif font-bold text-foreground mb-2">Чеки</h2>
          <p className="text-muted-foreground">Расчет зарплат сотрудников</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Текущий период</div>
          <div className="flex items-center gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousPeriod}
            >
              <Icon name="ChevronLeft" size={16} />
            </Button>
            <div className="font-semibold text-lg flex-1 text-center">
              {currentPeriod.label}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPeriod}
            >
              <Icon name="ChevronRight" size={16} />
            </Button>
          </div>
        </Card>
        
        <Card className="p-4 bg-green-500/10 border-green-500/20">
          <div className="text-sm text-muted-foreground mb-1">Сумма моделей</div>
          <div className="text-2xl font-bold text-green-600">{totalModelSum.toLocaleString()}₽</div>
        </Card>

        <Card className="p-4 bg-green-500/10 border-green-500/20">
          <div className="text-sm text-muted-foreground mb-1">Сумма операторов</div>
          <div className="text-2xl font-bold text-green-600">{totalOperatorSum.toLocaleString()}₽</div>
        </Card>

        {userRole === 'director' && soloMakersCount > 0 && (
          <Card className="p-4 bg-purple-500/10 border-purple-500/20">
            <div className="text-sm text-muted-foreground mb-1">Сумма соло-мейкеров</div>
            <div className="text-2xl font-bold text-purple-600">{totalSoloMakerSum.toLocaleString()}₽</div>
          </Card>
        )}
      </div>
    </>
  );
};

export default ChecksHeader;
