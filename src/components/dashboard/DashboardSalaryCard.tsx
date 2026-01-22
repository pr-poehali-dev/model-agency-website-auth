import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface DashboardSalaryCardProps {
  isLoading: boolean;
  salaryInRubles: number;
  salaryInDollars: number;
  exchangeRate: number;
  adjustments: {
    advance: number;
    penalty: number;
    expenses?: number;
  };
  salaryData: any;
}

const DashboardSalaryCard = ({
  isLoading,
  salaryInRubles,
  salaryInDollars,
  exchangeRate,
  adjustments,
  salaryData
}: DashboardSalaryCardProps) => {
  return (
    <Card className="p-6 bg-gradient-to-br from-green-500/5 to-emerald-500/5 border-green-500/20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-500/10 rounded-lg">
            <Icon name="Wallet" size={24} className="text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Моя зарплата</h2>
            <p className="text-sm text-muted-foreground">За выбранный период</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          disabled={isLoading}
          className="h-9 w-9 p-0"
        >
          <Icon name={isLoading ? "Loader2" : "RefreshCw"} size={16} className={isLoading ? "animate-spin" : ""} />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Icon name="Loader2" size={32} className="animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-serif font-bold text-foreground">
                {salaryInRubles.toLocaleString('ru-RU')} ₽
              </p>
              <span className="text-sm text-muted-foreground">(Итого к выплате)</span>
            </div>
            <p className="text-lg text-muted-foreground">
              ${salaryInDollars.toLocaleString('en-US')} × {exchangeRate.toFixed(2)} ₽
            </p>
          </div>

          <div className="h-px bg-border" />

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <Icon name="TrendingUp" size={16} />
                Базовая ставка
              </span>
              <span className="font-medium text-foreground">
                ${salaryData?.total?.toFixed(2) || '0.00'}
              </span>
            </div>

            {adjustments.expenses > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-600 dark:text-blue-400 flex items-center gap-2">
                  <Icon name="Plus" size={16} />
                  Расходы
                </span>
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  +{adjustments.expenses.toLocaleString('ru-RU')} ₽
                </span>
              </div>
            )}

            {adjustments.advance > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-red-600 dark:text-red-400 flex items-center gap-2">
                  <Icon name="Minus" size={16} />
                  Аванс
                </span>
                <span className="font-medium text-red-600 dark:text-red-400">
                  -{adjustments.advance.toLocaleString('ru-RU')} ₽
                </span>
              </div>
            )}

            {adjustments.penalty > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-red-600 dark:text-red-400 flex items-center gap-2">
                  <Icon name="AlertCircle" size={16} />
                  Штраф
                </span>
                <span className="font-medium text-red-600 dark:text-red-400">
                  -{adjustments.penalty.toLocaleString('ru-RU')} ₽
                </span>
              </div>
            )}

            <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
              <span className="text-muted-foreground flex items-center gap-2">
                <Icon name="DollarSign" size={16} />
                Курс USD
              </span>
              <span className="font-medium text-foreground">
                {exchangeRate.toFixed(2)} ₽
              </span>
            </div>
          </div>

          {salaryData?.breakdown && (
            <>
              <div className="h-px bg-border" />
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Icon name="BarChart3" size={16} />
                  Детализация
                </h3>
                <div className="space-y-2 text-sm">
                  {Object.entries(salaryData.breakdown).map(([key, value]: [string, any]) => (
                    <div key={key} className="flex items-center justify-between py-1">
                      <span className="text-muted-foreground capitalize">
                        {key === 'chaturbate' ? 'Chaturbate' : 
                         key === 'bongacams' ? 'BongaCams' : 
                         key === 'other' ? 'Другое' : key}
                      </span>
                      <span className="font-medium text-foreground">${value.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  );
};

export default DashboardSalaryCard;
