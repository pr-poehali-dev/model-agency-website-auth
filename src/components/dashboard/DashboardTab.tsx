import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface MonthlyRevenue {
  month: string;
  revenue: number;
  bookings: number;
}

interface DashboardTabProps {
  monthlyRevenue: MonthlyRevenue[];
}

const DashboardTab = ({ monthlyRevenue }: DashboardTabProps) => {
  const totalBookings = monthlyRevenue.reduce((sum, m) => sum + m.bookings, 0);
  const avgRevenue = monthlyRevenue.reduce((sum, m) => sum + m.revenue, 0) / monthlyRevenue.length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-serif font-bold text-foreground mb-2">Аналитика</h2>
        <p className="text-muted-foreground">Подробная статистика и показатели</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Icon name="Calendar" size={24} className="text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Всего бронирований</p>
              <p className="text-2xl font-bold">{totalBookings}</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            За последние 7 месяцев
          </Badge>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-accent/10 rounded-lg">
              <Icon name="TrendingUp" size={24} className="text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Средняя выручка</p>
              <p className="text-2xl font-bold">₽{Math.round(avgRevenue).toLocaleString()}</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-accent/10 text-accent">
            В месяц
          </Badge>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Icon name="BarChart3" size={20} className="text-primary" />
          Выручка и бронирования
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={monthlyRevenue}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Line 
              yAxisId="left" 
              type="monotone" 
              dataKey="revenue" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3} 
              name="Выручка (₽)" 
            />
            <Line 
              yAxisId="right" 
              type="monotone" 
              dataKey="bookings" 
              stroke="hsl(var(--accent))" 
              strokeWidth={3} 
              name="Бронирования" 
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

export default DashboardTab;
