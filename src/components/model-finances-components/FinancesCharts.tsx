import { Card } from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface DayData {
  date: string;
  cb: number;
  sp: number;
  soda: number;
  cbIncome: number;
  spIncome: number;
  sodaIncome: number;
  stripchatTokens: number;
  transfers: number;
  operator: string;
  shift: boolean;
}

interface FinancesChartsProps {
  onlineData: DayData[];
}

const FinancesCharts = ({ onlineData }: FinancesChartsProps) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${day}.${month}`;
  };

  const chartData = onlineData.map((day) => ({
    date: formatDate(day.date),
    cb: day.cb,
    sp: day.sp,
    soda: day.soda,
    cbIncome: day.cbIncome,
    spIncome: day.spIncome,
    sodaIncome: day.sodaIncome,
    totalIncome: day.cbIncome + day.spIncome + day.sodaIncome + day.transfers,
  }));

  const totalCb = onlineData.reduce((sum, day) => sum + day.cb, 0);
  const totalSp = onlineData.reduce((sum, day) => sum + day.sp, 0);
  const totalSoda = onlineData.reduce((sum, day) => sum + day.soda, 0);
  const totalCbIncome = onlineData.reduce((sum, day) => sum + day.cbIncome, 0);
  const totalSpIncome = onlineData.reduce((sum, day) => sum + day.spIncome, 0);
  const totalSodaIncome = onlineData.reduce((sum, day) => sum + day.sodaIncome, 0);
  const totalTransfers = onlineData.reduce((sum, day) => sum + day.transfers, 0);
  const totalIncome = totalCbIncome + totalSpIncome + totalSodaIncome + totalTransfers;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6 shadow-lg border-2 bg-gradient-to-br from-background to-muted/20">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-foreground">
            Доход по дням ($)
          </h3>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '2px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
              formatter={(value: any) => `$${Number(value).toFixed(2)}`}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
            <Line
              type="monotone"
              dataKey="cbIncome"
              stroke="#f59e0b"
              strokeWidth={3}
              name="Chaturbate"
              dot={{ fill: '#f59e0b', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="spIncome"
              stroke="#ef4444"
              strokeWidth={3}
              name="Stripchat"
              dot={{ fill: '#ef4444', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="sodaIncome"
              stroke="#06b6d4"
              strokeWidth={3}
              name="CamSoda"
              dot={{ fill: '#06b6d4', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6 shadow-lg border-2 bg-gradient-to-br from-background to-muted/20">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-foreground">
            Токены по дням
          </h3>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '2px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
            />
            <Bar dataKey="cb" fill="#f59e0b" name="Chaturbate" radius={[8, 8, 0, 0]} />
            <Bar dataKey="sp" fill="#ef4444" name="Stripchat" radius={[8, 8, 0, 0]} />
            <Bar dataKey="soda" fill="#06b6d4" name="CamSoda" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6 shadow-lg border-2 bg-gradient-to-br from-background to-muted/20">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-foreground">
            Общая статистика
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 border border-amber-200 dark:border-amber-800">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">Всего токенов CB</p>
            <p className="text-2xl font-bold text-amber-900 dark:text-amber-200">{totalCb.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-lg bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">Всего токенов SP</p>
            <p className="text-2xl font-bold text-red-900 dark:text-red-200">{totalSp.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-50 to-cyan-100/50 dark:from-cyan-950/30 dark:to-cyan-900/20 border border-cyan-200 dark:border-cyan-800">
            <p className="text-xs font-medium text-cyan-700 dark:text-cyan-400 mb-1">Всего токенов Soda</p>
            <p className="text-2xl font-bold text-cyan-900 dark:text-cyan-200">{totalSoda.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 border border-amber-200 dark:border-amber-800">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">Доход CB</p>
            <p className="text-2xl font-bold text-amber-900 dark:text-amber-200">${totalCbIncome.toFixed(2)}</p>
          </div>
          <div className="p-3 rounded-lg bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">Доход SP</p>
            <p className="text-2xl font-bold text-red-900 dark:text-red-200">${totalSpIncome.toFixed(2)}</p>
          </div>
          <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-50 to-cyan-100/50 dark:from-cyan-950/30 dark:to-cyan-900/20 border border-cyan-200 dark:border-cyan-800">
            <p className="text-xs font-medium text-cyan-700 dark:text-cyan-400 mb-1">Доход Soda</p>
            <p className="text-2xl font-bold text-cyan-900 dark:text-cyan-200">${totalSodaIncome.toFixed(2)}</p>
          </div>
          <div className="p-3 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border border-purple-200 dark:border-purple-800">
            <p className="text-xs font-medium text-purple-700 dark:text-purple-400 mb-1">Переводы</p>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-200">${totalTransfers.toFixed(2)}</p>
          </div>
          <div className="p-3 rounded-lg bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 border-2 border-green-400 dark:border-green-600 shadow-lg">
            <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">Итого доход</p>
            <p className="text-2xl font-bold text-green-900 dark:text-green-200">${totalIncome.toFixed(2)}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6 shadow-lg border-2 bg-gradient-to-br from-background to-muted/20">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-foreground">
            Общий доход ($)
          </h3>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '2px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
              formatter={(value: any) => `$${Number(value).toFixed(2)}`}
            />
            <Bar 
              dataKey="totalIncome" 
              fill="url(#colorIncome)" 
              name="Общий доход" 
              radius={[8, 8, 0, 0]}
            />
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.4}/>
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

export default FinancesCharts;