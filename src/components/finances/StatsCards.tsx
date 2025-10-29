import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface StatsCardsProps {
  totalRevenue: number;
  monthlyRevenue: number;
  pendingPayments: number;
}

const StatsCards = ({ totalRevenue, monthlyRevenue, pendingPayments }: StatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-primary/20 rounded-lg">
            <Icon name="DollarSign" size={24} className="text-primary" />
          </div>
          <Badge variant="secondary" className="bg-primary/20 text-primary">+12%</Badge>
        </div>
        <h3 className="text-sm font-medium text-muted-foreground mb-1">Общая выручка</h3>
        <p className="text-3xl font-serif font-bold text-foreground">
          ₽{totalRevenue.toLocaleString()}
        </p>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-accent/10 to-primary/10 border-accent/20">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-accent/20 rounded-lg">
            <Icon name="TrendingUp" size={24} className="text-accent" />
          </div>
          <Badge variant="secondary" className="bg-accent/20 text-accent">Октябрь</Badge>
        </div>
        <h3 className="text-sm font-medium text-muted-foreground mb-1">Выручка за месяц</h3>
        <p className="text-3xl font-serif font-bold text-foreground">
          ₽{monthlyRevenue.toLocaleString()}
        </p>
      </Card>

      <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-orange-500/20 rounded-lg">
            <Icon name="Clock" size={24} className="text-orange-500" />
          </div>
          <Badge variant="secondary" className="bg-orange-500/20 text-orange-500">Требуется внимание</Badge>
        </div>
        <h3 className="text-sm font-medium text-muted-foreground mb-1">Ожидают оплаты</h3>
        <p className="text-3xl font-serif font-bold text-foreground">{pendingPayments}</p>
      </Card>
    </div>
  );
};

export default StatsCards;
