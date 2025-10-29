import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const onlineData = [
  { date: '16.10', cb: 41, sp: 106, soda: 0, cam4: 0, cbIncome: 44.01, spIncome: 0, sodaIncome: 0, cam4Income: 0 },
  { date: '17.10', cb: 38, sp: 79, soda: 0, cam4: 0, cbIncome: 1.62, spIncome: 0, sodaIncome: 0, cam4Income: 0 },
  { date: '18.10', cb: 49, sp: 108, soda: 0, cam4: 0, cbIncome: 67.59, spIncome: 0, sodaIncome: 0, cam4Income: 0 },
  { date: '19.10', cb: 46, sp: 119, soda: 0, cam4: 0, cbIncome: 38.61, spIncome: 525, sodaIncome: 0, cam4Income: 0 },
  { date: '20.10', cb: 39, sp: 103, soda: 0, cam4: 0, cbIncome: 2.67, spIncome: 0, sodaIncome: 0, cam4Income: 0 },
  { date: '21.10', cb: 26, sp: 98, soda: 0, cam4: 0, cbIncome: 0.06, spIncome: 0, sodaIncome: 0, cam4Income: 0 },
  { date: '22.10', cb: 31, sp: 69, soda: 0, cam4: 0, cbIncome: 3.00, spIncome: 0, sodaIncome: 0, cam4Income: 0 },
  { date: '23.10', cb: 100, sp: 81, soda: 0, cam4: 0.2, cbIncome: 18.84, spIncome: 0, sodaIncome: 0, cam4Income: 0.12 },
  { date: '24.10', cb: 30, sp: 78, soda: 0, cam4: 0.4, cbIncome: 8.37, spIncome: 515.58, sodaIncome: 0, cam4Income: 0.24 },
  { date: '25.10', cb: 0, sp: 0, soda: 0, cam4: 0, cbIncome: 0, spIncome: 0, sodaIncome: 0, cam4Income: 0 },
  { date: '26.10', cb: 0, sp: 0, soda: 0, cam4: 0, cbIncome: 0, spIncome: 0, sodaIncome: 0, cam4Income: 0 },
  { date: '27.10', cb: 34, sp: 77, soda: 0, cam4: 0, cbIncome: 15.30, spIncome: 97.53, sodaIncome: 0, cam4Income: 0 },
];

const platformSummary = [
  { platform: 'Chaturbate', tokens: 1467, income: 200.07 },
  { platform: 'Stripchat', tokens: 37137, income: 1138.11 },
  { platform: 'CamSoda', tokens: 0, income: 0 },
  { platform: 'Cam4', tokens: 0.6, income: 0.36 },
];

const graphOnlineData = [
  { date: '16.10', onlineSP: 106, onlineCB: 41 },
  { date: '17.10', onlineSP: 79, onlineCB: 38 },
  { date: '18.10', onlineSP: 108, onlineCB: 49 },
  { date: '19.10', onlineSP: 119, onlineCB: 46 },
  { date: '20.10', onlineSP: 103, onlineCB: 39 },
  { date: '21.10', onlineSP: 98, onlineCB: 26 },
  { date: '22.10', onlineSP: 69, onlineCB: 31 },
  { date: '23.10', onlineSP: 81, onlineCB: 100 },
  { date: '24.10', onlineSP: 78, onlineCB: 30 },
  { date: '27.10', onlineSP: 77, onlineCB: 34 },
];

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

interface FinancesTabProps {
  transactions: Transaction[];
  monthlyRevenue: MonthlyRevenue[];
  modelPerformance: ModelPerformance[];
}

const FinancesTab = ({ transactions, monthlyRevenue, modelPerformance }: FinancesTabProps) => {
  const totalRevenue = transactions.reduce((sum, t) => sum + (t.status === 'Paid' ? t.amount : 0), 0);
  const pendingPayments = transactions.filter(t => t.status === 'Pending').length;

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-4xl font-serif font-bold text-foreground mb-2">Финансы</h2>
        <p className="text-muted-foreground">Статистика доходов и платформ</p>
      </div>

      {/* Карточки статистики */}
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
            ₽{monthlyRevenue[monthlyRevenue.length - 1]?.revenue.toLocaleString()}
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

      {/* Графики */}
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

      {/* Таблица транзакций */}
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

      {/* Таблица */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="p-3 text-left font-semibold text-foreground">Настоящий период</th>
                {onlineData.map((d) => (
                  <th key={d.date} className="p-3 text-center font-medium text-foreground whitespace-nowrap">
                    {d.date}
                  </th>
                ))}
                <th className="p-3 text-center font-semibold text-foreground dark:bg-yellow-900/30 bg-slate-700">
                  Tokens
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Online CB */}
              <tr className="border-b border-border hover:bg-muted/30">
                <td className="p-3 font-medium text-foreground">Online CB</td>
                {onlineData.map((d) => (
                  <td key={d.date} className="p-3 text-center text-muted-foreground">
                    {d.cb || ''}
                  </td>
                ))}
                <td className="p-3 text-center font-semibold dark:bg-yellow-900/30 bg-slate-800">1467</td>
              </tr>

              {/* Chaturbate */}
              <tr className="border-b border-border dark:bg-orange-900/20 bg-orange-900/30">
                <td className="p-3 font-medium text-foreground">Chaturbate</td>
                {onlineData.map((d) => (
                  <td key={d.date} className="p-3 text-center text-muted-foreground">
                    {d.cb || ''}
                  </td>
                ))}
                <td className="p-3 text-center font-semibold dark:bg-yellow-900/50 bg-yellow-800/50">669</td>
              </tr>

              {/* Online SP */}
              <tr className="border-b border-border hover:bg-muted/30">
                <td className="p-3 font-medium text-foreground">Online SP</td>
                {onlineData.map((d) => (
                  <td key={d.date} className="p-3 text-center text-muted-foreground">
                    {d.sp || ''}
                  </td>
                ))}
                <td className="p-3 text-center font-semibold dark:bg-yellow-900/50 bg-yellow-800/50">Tokens</td>
              </tr>

              {/* Stripchat */}
              <tr className="border-b border-border dark:bg-red-900/20 bg-red-900/30">
                <td className="p-3 font-medium text-foreground">Stripchat</td>
                <td className="p-3 text-center text-muted-foreground"></td>
                <td className="p-3 text-center text-muted-foreground"></td>
                <td className="p-3 text-center text-muted-foreground"></td>
                <td className="p-3 text-center text-muted-foreground">17500</td>
                <td className="p-3 text-center text-muted-foreground"></td>
                <td className="p-3 text-center text-muted-foreground"></td>
                <td className="p-3 text-center text-muted-foreground"></td>
                <td className="p-3 text-center text-muted-foreground"></td>
                <td className="p-3 text-center text-muted-foreground">17186</td>
                <td className="p-3 text-center text-muted-foreground"></td>
                <td className="p-3 text-center text-muted-foreground"></td>
                <td className="p-3 text-center text-muted-foreground">3251</td>
                <td className="p-3 text-center font-semibold dark:bg-yellow-900/50 bg-yellow-800/50">37937</td>
              </tr>

              {/* Online Soda */}
              <tr className="border-b border-border hover:bg-muted/30">
                <td className="p-3 font-medium text-foreground">Online Soda</td>
                {onlineData.map((d) => (
                  <td key={d.date} className="p-3 text-center text-muted-foreground">
                    {d.soda || ''}
                  </td>
                ))}
                <td className="p-3 text-center font-semibold dark:bg-yellow-900/50 bg-yellow-800/50">Tokens</td>
              </tr>

              {/* CamSoda */}
              <tr className="border-b border-border dark:bg-blue-900/20 bg-blue-900/30">
                <td className="p-3 font-medium text-foreground">CamSoda</td>
                {onlineData.map(() => (
                  <td key={Math.random()} className="p-3 text-center text-muted-foreground"></td>
                ))}
                <td className="p-3 text-center font-semibold dark:bg-yellow-900/50 bg-yellow-800/50">0</td>
              </tr>

              {/* Cam4 */}
              <tr className="border-b border-border dark:bg-orange-900/20 bg-orange-900/30">
                <td className="p-3 font-medium text-foreground">Cam4</td>
                <td className="p-3 text-center text-muted-foreground"></td>
                <td className="p-3 text-center text-muted-foreground"></td>
                <td className="p-3 text-center text-muted-foreground"></td>
                <td className="p-3 text-center text-muted-foreground"></td>
                <td className="p-3 text-center text-muted-foreground"></td>
                <td className="p-3 text-center text-muted-foreground"></td>
                <td className="p-3 text-center text-muted-foreground"></td>
                <td className="p-3 text-center text-muted-foreground">0.2</td>
                <td className="p-3 text-center text-muted-foreground">0.4</td>
                <td className="p-3 text-center text-muted-foreground"></td>
                <td className="p-3 text-center text-muted-foreground"></td>
                <td className="p-3 text-center text-muted-foreground">0</td>
                <td className="p-3 text-center font-semibold dark:bg-yellow-900/50 bg-yellow-800/50">0.6</td>
              </tr>

              {/* Переводы */}
              <tr className="border-b border-border dark:bg-teal-900/20 bg-teal-900/30">
                <td className="p-3 font-medium text-foreground">Переводы</td>
                {onlineData.map(() => (
                  <td key={Math.random()} className="p-3 text-center text-muted-foreground"></td>
                ))}
                <td className="p-3 text-center font-semibold dark:bg-yellow-900/50 bg-yellow-800/50">0</td>
              </tr>

              {/* Оператор (Имя) */}
              <tr className="border-b border-border hover:bg-muted/30">
                <td className="p-3 font-medium text-foreground">Оператор (Имя)</td>
                <td className="p-3 text-center text-muted-foreground">Женя</td>
                <td className="p-3 text-center text-muted-foreground">Женя</td>
                <td className="p-3 text-center text-muted-foreground">Женя</td>
                <td className="p-3 text-center text-muted-foreground">Женя</td>
                <td className="p-3 text-center text-muted-foreground">Женя</td>
                <td className="p-3 text-center text-muted-foreground">Женя</td>
                <td className="p-3 text-center text-muted-foreground">Женя</td>
                <td className="p-3 text-center text-muted-foreground">Женя</td>
                <td className="p-3 text-center text-muted-foreground">Женя</td>
                <td className="p-3 text-center text-muted-foreground">Женя</td>
                <td className="p-3 text-center text-muted-foreground"></td>
                <td className="p-3 text-center text-muted-foreground"></td>
                <td className="p-3 text-center font-semibold dark:bg-yellow-900/50 bg-yellow-800/50"></td>
              </tr>

              {/* Смены (чекбоксы) */}
              <tr className="border-b border-border hover:bg-muted/30">
                <td className="p-3 font-medium text-foreground">Смены</td>
                <td className="p-3 text-center">✓</td>
                <td className="p-3 text-center">✓</td>
                <td className="p-3 text-center">✓</td>
                <td className="p-3 text-center">✓</td>
                <td className="p-3 text-center">✓</td>
                <td className="p-3 text-center">✓</td>
                <td className="p-3 text-center">✓</td>
                <td className="p-3 text-center">✓</td>
                <td className="p-3 text-center">✓</td>
                <td className="p-3 text-center">✓</td>
                <td className="p-3 text-center"></td>
                <td className="p-3 text-center"></td>
                <td className="p-3 text-center font-semibold dark:bg-yellow-900/50 bg-yellow-800/50">10</td>
              </tr>

              {/* Total Income */}
              <tr className="border-b-2 border-border bg-muted/50 font-semibold">
                <td className="p-3 text-foreground">Income</td>
                {onlineData.map((d) => {
                  const total = d.cbIncome + d.spIncome + d.sodaIncome + d.cam4Income;
                  return (
                    <td key={d.date} className="p-3 text-center text-foreground">
                      ${total.toFixed(2)}
                    </td>
                  );
                })}
                <td className="p-3 text-center font-bold text-green-600 dark:text-green-400 bg-yellow-100 dark:bg-yellow-900/30">
                  $1,338.54
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Графики */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* График по платформам (Bar Chart) */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-foreground mb-4">Доход по платформам</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={platformSummary}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="platform" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))',
                }}
              />
              <Legend />
              <Bar dataKey="income" fill="hsl(var(--primary))" name="Доход ($)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* График онлайна (Line Chart) */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-foreground mb-4">График онлайна</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={graphOnlineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="onlineSP"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Online SP"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="onlineCB"
                stroke="#ef4444"
                strokeWidth={2}
                name="Online CB"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};

export default FinancesTab;