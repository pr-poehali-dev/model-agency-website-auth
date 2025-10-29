import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Model {
  id: number;
  name: string;
  image: string;
  height: string;
  bust: string;
  waist: string;
  hips: string;
  experience: string;
  specialty: string;
  status: string;
}

interface Transaction {
  id: number;
  date: string;
  model: string;
  project: string;
  amount: number;
  status: string;
}

interface MonthlyRevenue {
  month: string;
  revenue: number;
  bookings: number;
}

interface ModelPerformance {
  name: string;
  earnings: number;
}

interface DashboardHomeProps {
  models: Model[];
  transactions: Transaction[];
  monthlyRevenue: MonthlyRevenue[];
  modelPerformance: ModelPerformance[];
}

const DashboardHome = ({ models, transactions, monthlyRevenue, modelPerformance }: DashboardHomeProps) => {
  const totalRevenue = transactions.reduce((sum, t) => sum + (t.status === 'Paid' ? t.amount : 0), 0);
  const pendingPayments = transactions.filter(t => t.status === 'Pending').length;
  const activeModels = models.filter(m => m.status === 'Available').length;

  return (
    <div className="space-y-6">
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
              <Icon name="Users" size={24} className="text-accent" />
            </div>
            <Badge variant="secondary" className="bg-accent/20 text-accent">{activeModels} активных</Badge>
          </div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Модели</h3>
          <p className="text-3xl font-serif font-bold text-foreground">{models.length}</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Icon name="TrendingUp" size={20} className="text-primary" />
            Месячная выручка
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyRevenue}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Icon name="Award" size={20} className="text-accent" />
            Топ моделей по доходу
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={modelPerformance}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="earnings" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Icon name="Receipt" size={20} className="text-primary" />
          Последние транзакции
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Дата</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Модель</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Проект</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Сумма</th>
                <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Статус</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                  <td className="py-3 px-4 text-sm">{transaction.date}</td>
                  <td className="py-3 px-4 text-sm font-medium">{transaction.model}</td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">{transaction.project}</td>
                  <td className="py-3 px-4 text-sm text-right font-semibold">₽{transaction.amount.toLocaleString()}</td>
                  <td className="py-3 px-4 text-center">
                    <Badge variant={transaction.status === 'Paid' ? 'default' : 'secondary'}>
                      {transaction.status === 'Paid' ? 'Оплачено' : 'Ожидание'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default DashboardHome;
