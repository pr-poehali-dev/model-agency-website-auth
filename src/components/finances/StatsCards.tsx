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
      <Card className="relative overflow-hidden p-6 hover:glow-primary group">
        <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary/30 blur-3xl opacity-60 group-hover:opacity-90 transition-opacity" />
        <div className="relative flex items-center justify-between mb-4">
          <div className="p-3 bg-primary/15 rounded-xl border border-primary/30 backdrop-blur-sm">
            <Icon name="DollarSign" size={24} className="text-primary" />
          </div>
          <Badge variant="secondary" className="bg-primary/20 text-primary border border-primary/30">+12%</Badge>
        </div>
        <h3 className="relative text-sm font-medium text-muted-foreground mb-1">Общая выручка</h3>
        <p className="relative text-3xl font-display font-bold text-gradient">
          ₽{totalRevenue.toLocaleString()}
        </p>
      </Card>

      <Card className="relative overflow-hidden p-6 hover:glow-accent group">
        <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-accent/30 blur-3xl opacity-60 group-hover:opacity-90 transition-opacity" />
        <div className="relative flex items-center justify-between mb-4">
          <div className="p-3 bg-accent/15 rounded-xl border border-accent/30 backdrop-blur-sm">
            <Icon name="TrendingUp" size={24} className="text-accent" />
          </div>
          <Badge variant="secondary" className="bg-accent/20 text-accent border border-accent/30">Октябрь</Badge>
        </div>
        <h3 className="relative text-sm font-medium text-muted-foreground mb-1">Выручка за месяц</h3>
        <p className="relative text-3xl font-display font-bold text-gradient">
          ₽{monthlyRevenue.toLocaleString()}
        </p>
      </Card>

      <Card className="relative overflow-hidden p-6 group">
        <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-orange-500/30 blur-3xl opacity-60 group-hover:opacity-90 transition-opacity" />
        <div className="relative flex items-center justify-between mb-4">
          <div className="p-3 bg-orange-500/15 rounded-xl border border-orange-500/30 backdrop-blur-sm">
            <Icon name="Clock" size={24} className="text-orange-400" />
          </div>
          <Badge variant="secondary" className="bg-orange-500/20 text-orange-400 border border-orange-500/30">Требуется внимание</Badge>
        </div>
        <h3 className="relative text-sm font-medium text-muted-foreground mb-1">Ожидают оплаты</h3>
        <p className="relative text-3xl font-display font-bold text-foreground">{pendingPayments}</p>
      </Card>
    </div>
  );
};

export default StatsCards;