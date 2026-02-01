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
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">
          Токены по дням
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="cb"
              stroke="#f97316"
              name="Chaturbate"
            />
            <Line
              type="monotone"
              dataKey="sp"
              stroke="#ef4444"
              name="Stripchat"
            />
            <Line
              type="monotone"
              dataKey="soda"
              stroke="#06b6d4"
              name="CamSoda"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">
          Доход по дням ($)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="cbIncome" fill="#f97316" name="CB доход" />
            <Bar dataKey="spIncome" fill="#ef4444" name="SP доход" />
            <Bar dataKey="sodaIncome" fill="#06b6d4" name="Soda доход" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">
          Общая статистика
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Всего токенов CB</p>
            <p className="text-2xl font-bold text-foreground">{totalCb.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Всего токенов SP</p>
            <p className="text-2xl font-bold text-foreground">{totalSp.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Всего токенов Soda</p>
            <p className="text-2xl font-bold text-foreground">{totalSoda.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Доход CB</p>
            <p className="text-2xl font-bold text-foreground">${totalCbIncome.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Доход SP</p>
            <p className="text-2xl font-bold text-foreground">${totalSpIncome.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Доход Soda</p>
            <p className="text-2xl font-bold text-foreground">${totalSodaIncome.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Переводы</p>
            <p className="text-2xl font-bold text-foreground">${totalTransfers.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Итого доход</p>
            <p className="text-2xl font-bold text-primary">${totalIncome.toFixed(2)}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-foreground">
          Общий доход ($)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="totalIncome" fill="#8b5cf6" name="Общий доход" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

export default FinancesCharts;
