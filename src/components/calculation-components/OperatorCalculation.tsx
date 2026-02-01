import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface User {
  id: number;
  email: string;
  fullName: string;
  role: string;
}

interface OperatorCalculationProps {
  users: User[];
  calculations: Record<string, {
    stripchat: string;
    chaturbate: string;
    camsoda: string;
    advance: string;
    penalty: string;
  }>;
  exchangeRate: number;
  onInputChange: (email: string, field: string, value: string) => void;
  calculateSalary: (email: string, role: string) => { dollars: number; rubles: number };
}

const OperatorCalculation = ({
  users,
  calculations,
  exchangeRate,
  onInputChange,
  calculateSalary
}: OperatorCalculationProps) => {
  const operators = users.filter(u => u.role === 'operator');
  const contentMakers = users.filter(u => u.role === 'content_maker');

  return (
    <>
      {operators.length > 0 && (
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Операторы</h3>
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
                  <th className="p-2 text-center font-medium text-foreground">Аванс (₽)</th>
                  <th className="p-2 text-center font-medium text-foreground">Штраф (₽)</th>
                  <th className="p-2 text-right font-medium text-foreground">ЗП ($)</th>
                  <th className="p-2 text-right font-medium text-foreground">ЗП (₽)</th>
                </tr>
              </thead>
              <tbody>
                {operators.map((user) => {
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
      )}

      {contentMakers.length > 0 && (
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Контент-мейкеры</h3>
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
                  <th className="p-2 text-center font-medium text-foreground">Аванс (₽)</th>
                  <th className="p-2 text-center font-medium text-foreground">Штраф (₽)</th>
                  <th className="p-2 text-right font-medium text-foreground">ЗП ($)</th>
                  <th className="p-2 text-right font-medium text-foreground">ЗП (₽)</th>
                </tr>
              </thead>
              <tbody>
                {contentMakers.map((user) => {
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
      )}
    </>
  );
};

export default OperatorCalculation;
