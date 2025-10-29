import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface ExchangeRateCardProps {
  exchangeRate: number;
  isLoadingRate: boolean;
  onRefresh: () => void;
}

const ExchangeRateCard = ({ exchangeRate, isLoadingRate, onRefresh }: ExchangeRateCardProps) => {
  return (
    <Card className="p-4 relative">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-muted-foreground">Курс USD</div>
        <Button 
          size="sm" 
          variant="outline"
          onClick={onRefresh}
          disabled={isLoadingRate}
          className="h-7 px-2"
        >
          <Icon name={isLoadingRate ? "Loader2" : "RefreshCw"} size={14} className={isLoadingRate ? "animate-spin" : ""} />
        </Button>
      </div>
      <div className="font-bold text-4xl text-primary">
        {exchangeRate.toFixed(2)}₽
      </div>
    </Card>
  );
};

export default ExchangeRateCard;
