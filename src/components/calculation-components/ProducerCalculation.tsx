import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface User {
  id: number;
  email: string;
  fullName: string;
  role: string;
}

interface ProducerCalculationProps {
  users: User[];
  calculations: Record<string, {
    stripchat: string;
    chaturbate: string;
    camsoda: string;
    advance: string;
    penalty: string;
    expenses?: string;
  }>;
  exchangeRate: number;
  onInputChange: (email: string, field: string, value: string) => void;
  calculateSalary: (email: string, role: string) => { dollars: number; rubles: number };
}

const ProducerCalculation = ({
  users,
  calculations,
  exchangeRate,
  onInputChange,
  calculateSalary
}: ProducerCalculationProps) => {
  const producers = users.filter(u => u.role === 'producer');

  if (producers.length === 0) return null;

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Продюсеры</h3>
        <div className="text-sm text-muted-foreground">
          Курс: {exchangeRate.toFixed(2)} ₽/$
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="p-2 text-left font-medium text-foreground">Имя</th>
              <th className="p-2 text-center font-medium text-foreground">Stripchat</th>
              <th className="p-2 text-center font-medium text-foreground">Chaturbate</th>
              <th className="p-2 text-center font-medium text-foreground">CamSoda</th>
              <th className="p-2 text-center font-medium text-foreground">Переводы ($)</th>
              <th className="p-2 text-center font-medium text-foreground">Расходы (₽)</th>
              <th className="p-2 text-center font-medium text-foreground">Аванс (₽)</th>
              <th className="p-2 text-center font-medium text-foreground">Штраф (₽)</th>
              <th className="p-2 text-right font-medium text-foreground">ЗП ($)</th>
              <th className="p-2 text-right font-medium text-foreground">ЗП (₽)</th>
            </tr>
          </thead>
          <tbody>
            {producers.map((user) => {
              const calc = calculations[user.email];
              const { dollars, rubles } = calculateSalary(user.email, user.role);
              
              return (
                <tr key={user.id} className="border-b border-border hover:bg-muted/30">
                  <td className="p-2 font-medium text-foreground">{user.fullName}</td>
                  <td className="p-2">
                    <Input
                      type="text"
                      value={calc?.stripchat || '0'}
                      onChange={(e) => onInputChange(user.email, 'stripchat', e.target.value)}
                      className="text-center"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="text"
                      value={calc?.chaturbate || '0'}
                      onChange={(e) => onInputChange(user.email, 'chaturbate', e.target.value)}
                      className="text-center"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="text"
                      value={calc?.camsoda || '0'}
                      onChange={(e) => onInputChange(user.email, 'camsoda', e.target.value)}
                      className="text-center"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="text"
                      value={calc?.transfers || '0'}
                      onChange={(e) => onInputChange(user.email, 'transfers', e.target.value)}
                      className="text-center"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="text"
                      value={calc?.expenses || '0'}
                      onChange={(e) => onInputChange(user.email, 'expenses', e.target.value)}
                      className="text-center bg-muted/30"
                      readOnly
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="text"
                      value={calc?.advance || '0'}
                      onChange={(e) => onInputChange(user.email, 'advance', e.target.value)}
                      className="text-center bg-muted/30"
                      readOnly
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="text"
                      value={calc?.penalty || '0'}
                      onChange={(e) => onInputChange(user.email, 'penalty', e.target.value)}
                      className="text-center bg-muted/30"
                      readOnly
                    />
                  </td>
                  <td className="p-2 text-right font-semibold">${dollars.toFixed(2)}</td>
                  <td className="p-2 text-right font-semibold">{rubles.toFixed(2)} ₽</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default ProducerCalculation;
