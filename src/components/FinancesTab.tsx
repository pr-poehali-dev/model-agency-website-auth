import { Card } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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

const FinancesTab = () => {
  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-4xl font-serif font-bold text-foreground mb-2">Финансы</h2>
        <p className="text-muted-foreground">Статистика доходов по платформам</p>
      </div>

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
              <tr className="border-b border-border bg-orange-50 dark:bg-orange-900/10">
                <td className="p-3 font-medium text-foreground">Chaturbate</td>
                {onlineData.map((d) => (
                  <td key={d.date} className="p-3 text-center text-muted-foreground">
                    {d.cb || ''}
                  </td>
                ))}
                <td className="p-3 text-center font-semibold bg-yellow-100 dark:bg-yellow-900/30">669</td>
              </tr>

              {/* Income on CB */}
              <tr className="border-b border-border">
                <td className="p-3 font-medium text-foreground">Income on CB</td>
                {onlineData.map((d) => (
                  <td key={d.date} className="p-3 text-center text-muted-foreground">
                    ${d.cbIncome.toFixed(2)}
                  </td>
                ))}
                <td className="p-3 text-center font-semibold bg-yellow-100 dark:bg-yellow-900/30">$200.07</td>
              </tr>

              {/* Online SP */}
              <tr className="border-b border-border hover:bg-muted/30">
                <td className="p-3 font-medium text-foreground">Online SP</td>
                {onlineData.map((d) => (
                  <td key={d.date} className="p-3 text-center text-muted-foreground">
                    {d.sp || ''}
                  </td>
                ))}
                <td className="p-3 text-center font-semibold bg-yellow-100 dark:bg-yellow-900/30">Tokens</td>
              </tr>

              {/* Stripchat */}
              <tr className="border-b border-border bg-red-50 dark:bg-red-900/10">
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
                <td className="p-3 text-center font-semibold bg-yellow-100 dark:bg-yellow-900/30">37937</td>
              </tr>

              {/* Income on SP */}
              <tr className="border-b border-border">
                <td className="p-3 font-medium text-foreground">Income on SP</td>
                {onlineData.map((d) => (
                  <td key={d.date} className="p-3 text-center text-muted-foreground">
                    ${d.spIncome.toFixed(2)}
                  </td>
                ))}
                <td className="p-3 text-center font-semibold bg-yellow-100 dark:bg-yellow-900/30">$1,138.11</td>
              </tr>

              {/* Online Soda */}
              <tr className="border-b border-border hover:bg-muted/30">
                <td className="p-3 font-medium text-foreground">Online Soda</td>
                {onlineData.map((d) => (
                  <td key={d.date} className="p-3 text-center text-muted-foreground">
                    {d.soda || ''}
                  </td>
                ))}
                <td className="p-3 text-center font-semibold bg-yellow-100 dark:bg-yellow-900/30">Tokens</td>
              </tr>

              {/* CamSoda */}
              <tr className="border-b border-border bg-blue-50 dark:bg-blue-900/10">
                <td className="p-3 font-medium text-foreground">CamSoda</td>
                {onlineData.map(() => (
                  <td key={Math.random()} className="p-3 text-center text-muted-foreground"></td>
                ))}
                <td className="p-3 text-center font-semibold bg-yellow-100 dark:bg-yellow-900/30">0</td>
              </tr>

              {/* Income on Soda */}
              <tr className="border-b border-border">
                <td className="p-3 font-medium text-foreground">Income on Soda</td>
                {onlineData.map((d) => (
                  <td key={d.date} className="p-3 text-center text-muted-foreground">
                    ${d.sodaIncome.toFixed(2)}
                  </td>
                ))}
                <td className="p-3 text-center font-semibold bg-yellow-100 dark:bg-yellow-900/30">$0.00</td>
              </tr>

              {/* Cam4 */}
              <tr className="border-b border-border bg-orange-50 dark:bg-orange-900/10">
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
                <td className="p-3 text-center font-semibold bg-yellow-100 dark:bg-yellow-900/30">0.6</td>
              </tr>

              {/* Income on Cam4 */}
              <tr className="border-b border-border">
                <td className="p-3 font-medium text-foreground">Income on Cam4</td>
                {onlineData.map((d) => (
                  <td key={d.date} className="p-3 text-center text-muted-foreground">
                    ${d.cam4Income.toFixed(2)}
                  </td>
                ))}
                <td className="p-3 text-center font-semibold bg-yellow-100 dark:bg-yellow-900/30">$0.36</td>
              </tr>

              {/* Переводы */}
              <tr className="border-b border-border bg-teal-50 dark:bg-teal-900/10">
                <td className="p-3 font-medium text-foreground">Переводы</td>
                {onlineData.map(() => (
                  <td key={Math.random()} className="p-3 text-center text-muted-foreground"></td>
                ))}
                <td className="p-3 text-center font-semibold bg-yellow-100 dark:bg-yellow-900/30">0</td>
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
                <td className="p-3 text-center font-semibold bg-yellow-100 dark:bg-yellow-900/30"></td>
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
                <td className="p-3 text-center font-semibold bg-yellow-100 dark:bg-yellow-900/30">10</td>
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