import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";
import { Period } from "@/utils/periodUtils";

interface FinancesHeaderProps {
  modelName: string;
  currentPeriod: Period;
  isSaving: boolean;
  lastSaved: Date | null;
  onBack?: () => void;
  onPreviousPeriod: () => void;
  onNextPeriod: () => void;
  onSave?: () => void;
}

const FinancesHeader = ({
  modelName,
  currentPeriod,
  isSaving,
  lastSaved,
  onBack,
  onPreviousPeriod,
  onNextPeriod,
  onSave,
}: FinancesHeaderProps) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack}>
            <Icon name="ArrowLeft" size={16} />
          </Button>
        )}
        <div>
          <h2 className="text-2xl font-bold text-foreground">{modelName}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Финансовые данные
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 border border-border rounded-lg p-1">
          <Button variant="ghost" size="sm" onClick={onPreviousPeriod}>
            <Icon name="ChevronLeft" size={16} />
          </Button>
          <span className="text-sm font-medium px-2 min-w-[150px] text-center">
            {currentPeriod.label}
          </span>
          <Button variant="ghost" size="sm" onClick={onNextPeriod}>
            <Icon name="ChevronRight" size={16} />
          </Button>
        </div>

        {isSaving && (
          <Badge variant="outline" className="text-xs">
            <Icon name="Loader2" size={12} className="mr-1 animate-spin" />
            Сохранение...
          </Badge>
        )}

        {!isSaving && lastSaved && (
          <Badge variant="outline" className="text-xs">
            <Icon name="Check" size={12} className="mr-1" />
            Сохранено {lastSaved.toLocaleTimeString("ru-RU")}
          </Badge>
        )}
      </div>
    </div>
  );
};

export default FinancesHeader;