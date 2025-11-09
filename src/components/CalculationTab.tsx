import { useState, useEffect, memo } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface User {
  id: number;
  email: string;
  fullName: string;
  role: string;
}

const USERS_API_URL = 'https://functions.poehali.dev/67fd6902-6170-487e-bb46-f6d14ec99066';

const CalculationTab = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [exchangeRate, setExchangeRate] = useState(74.23);
  const [calculations, setCalculations] = useState<Record<string, {
    stripchat: string;
    chaturbate: string;
    advance: string;
    penalty: string;
  }>>({});

  useEffect(() => {
    loadUsers();
    loadExchangeRate();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await fetch(USERS_API_URL);
      const data = await response.json();
      const employees = data.filter((u: User) => 
        u.role === 'operator' || u.role === 'content_maker' || u.role === 'producer'
      );
      setUsers(employees);
      
      const initialCalc: Record<string, any> = {};
      employees.forEach((user: User) => {
        initialCalc[user.email] = {
          stripchat: '0',
          chaturbate: '0',
          advance: '0',
          penalty: '0'
        };
      });
      setCalculations(initialCalc);
    } catch (err) {
      console.error('Failed to load users', err);
    }
  };

  const loadExchangeRate = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/be3de232-e5c9-421e-8335-c4f67a2d744a');
      const data = await response.json();
      if (data.rate) {
        setExchangeRate(data.rate - 7);
      }
    } catch (err) {
      console.error('Failed to load exchange rate', err);
    }
  };

  const handleInputChange = (email: string, field: string, value: string) => {
    const numValue = value.replace(/[^0-9]/g, '');
    setCalculations(prev => ({
      ...prev,
      [email]: {
        ...prev[email],
        [field]: numValue
      }
    }));
  };

  const calculateSalary = (email: string, role: string) => {
    const calc = calculations[email];
    if (!calc) return { dollars: 0, rubles: 0 };

    const stripchat = parseInt(calc.stripchat || '0');
    const chaturbate = parseInt(calc.chaturbate || '0');
    const advance = parseInt(calc.advance || '0');
    const penalty = parseInt(calc.penalty || '0');

    const stripchatDollars = stripchat * 0.05;
    const chaturbateDollars = chaturbate * 0.05;
    const totalCheck = stripchatDollars + chaturbateDollars;

    let salaryDollars = 0;
    if (role === 'content_maker') {
      salaryDollars = totalCheck * 0.3;
    } else if (role === 'operator') {
      salaryDollars = totalCheck * 0.2;
    } else if (role === 'producer') {
      salaryDollars = totalCheck * 0.1;
    }

    const salaryRubles = (salaryDollars * exchangeRate) - advance - penalty;

    return {
      dollars: Math.round(salaryDollars * 100) / 100,
      rubles: Math.round(salaryRubles * 100) / 100,
      totalCheck: Math.round(totalCheck * 100) / 100
    };
  };

  const operators = users.filter(u => u.role === 'operator');
  const models = users.filter(u => u.role === 'content_maker');
  const producers = users.filter(u => u.role === 'producer');

  const totalOperators = operators.reduce((sum, op) => {
    return sum + calculateSalary(op.email, op.role).rubles;
  }, 0);

  const totalModels = models.reduce((sum, model) => {
    return sum + calculateSalary(model.email, model.role).rubles;
  }, 0);

  const totalProducers = producers.reduce((sum, prod) => {
    return sum + calculateSalary(prod.email, prod.role).rubles;
  }, 0);

  const totalSolo = 0;
  const totalAll = totalOperators + totalModels + totalProducers + totalSolo;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-serif font-bold text-foreground mb-2">Подсчёт зарплат</h2>
        <p className="text-muted-foreground">Ручной расчёт по токенам для проверки</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Card className="p-4 bg-blue-500/10 border-blue-500/20">
          <div className="text-sm text-muted-foreground mb-1">Операторы</div>
          <div className="text-2xl font-bold text-blue-600">{Math.round(totalOperators).toLocaleString()} ₽</div>
        </Card>

        <Card className="p-4 bg-purple-500/10 border-purple-500/20">
          <div className="text-sm text-muted-foreground mb-1">Мейкеры</div>
          <div className="text-2xl font-bold text-purple-600">{Math.round(totalModels).toLocaleString()} ₽</div>
        </Card>

        <Card className="p-4 bg-cyan-500/10 border-cyan-500/20">
          <div className="text-sm text-muted-foreground mb-1">Продюсеры</div>
          <div className="text-2xl font-bold text-cyan-600">{Math.round(totalProducers).toLocaleString()} ₽</div>
        </Card>

        <Card className="p-4 bg-orange-500/10 border-orange-500/20">
          <div className="text-sm text-muted-foreground mb-1">Соло</div>
          <div className="text-2xl font-bold text-orange-600">{Math.round(totalSolo).toLocaleString()} ₽</div>
        </Card>

        <Card className="p-4 bg-green-500/10 border-green-500/20">
          <div className="text-sm text-muted-foreground mb-1">Общ</div>
          <div className="text-2xl font-bold text-green-600">{Math.round(totalAll).toLocaleString()} ₽</div>
        </Card>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Icon name="Users" size={24} />
            Операторы
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {operators.map(user => {
              const calc = calculations[user.email] || {};
              const salary = calculateSalary(user.email, user.role);
              return (
                <Card key={user.id} className="p-4 bg-pink-500/5 border-pink-500/20">
                  <h4 className="font-bold text-lg mb-3 text-center">{user.fullName || user.email}</h4>
                  
                  <div className="space-y-2 mb-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">Сумма $</div>
                      <div className="font-semibold text-right">{salary.dollars}</div>
                      
                      <div className="text-muted-foreground">Курс</div>
                      <div className="font-semibold text-right">{exchangeRate}</div>
                      
                      <div className="text-muted-foreground">Сумма ₽</div>
                      <div className="font-semibold text-right">{salary.rubles} ₽</div>
                      
                      <div className="text-muted-foreground">Аванс</div>
                      <div className="font-semibold text-right">{calc.advance || 0}</div>
                      
                      <div className="text-muted-foreground">Штраф</div>
                      <div className="font-semibold text-right">{calc.penalty || 0}</div>
                      
                      <div className="text-muted-foreground">Дополжить</div>
                      <div className="font-semibold text-right">0,00 ₽</div>
                    </div>
                    
                    <div className="border-t pt-2 mt-2">
                      <div className="grid grid-cols-2 gap-2 text-sm font-bold">
                        <div>Итог</div>
                        <div className="text-right text-green-600">{salary.rubles} ₽</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 border-t pt-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">StripChat</div>
                      <div className="font-semibold text-right">{salary.totalCheck > 0 ? Math.round((parseInt(calc.stripchat || '0') * 0.05 / salary.totalCheck) * 100) : 0}%</div>
                    </div>
                    <Input
                      type="text"
                      placeholder="Токены StripChat"
                      value={calc.stripchat || ''}
                      onChange={(e) => handleInputChange(user.email, 'stripchat', e.target.value)}
                      className="text-center"
                    />
                    
                    <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                      <div className="text-muted-foreground">Chaturbate</div>
                      <div className="font-semibold text-right">{salary.totalCheck > 0 ? Math.round((parseInt(calc.chaturbate || '0') * 0.05 / salary.totalCheck) * 100) : 0}%</div>
                    </div>
                    <Input
                      type="text"
                      placeholder="Токены Chaturbate"
                      value={calc.chaturbate || ''}
                      onChange={(e) => handleInputChange(user.email, 'chaturbate', e.target.value)}
                      className="text-center"
                    />

                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <Input
                        type="text"
                        placeholder="Аванс"
                        value={calc.advance || ''}
                        onChange={(e) => handleInputChange(user.email, 'advance', e.target.value)}
                        className="text-center"
                      />
                      <Input
                        type="text"
                        placeholder="Штраф"
                        value={calc.penalty || ''}
                        onChange={(e) => handleInputChange(user.email, 'penalty', e.target.value)}
                        className="text-center"
                      />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Icon name="Star" size={24} />
            Мейкеры
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {models.map(user => {
              const calc = calculations[user.email] || {};
              const salary = calculateSalary(user.email, user.role);
              return (
                <Card key={user.id} className="p-4 bg-yellow-500/5 border-yellow-500/20">
                  <h4 className="font-bold text-lg mb-3 text-center">{user.fullName || user.email}</h4>
                  
                  <div className="space-y-2 mb-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">Сумма $</div>
                      <div className="font-semibold text-right">{salary.dollars}</div>
                      
                      <div className="text-muted-foreground">Курс</div>
                      <div className="font-semibold text-right">{exchangeRate}</div>
                      
                      <div className="text-muted-foreground">Сумма ₽</div>
                      <div className="font-semibold text-right">{salary.rubles} ₽</div>
                      
                      <div className="text-muted-foreground">Аванс</div>
                      <div className="font-semibold text-right">{calc.advance || 0}</div>
                      
                      <div className="text-muted-foreground">Штраф</div>
                      <div className="font-semibold text-right">{calc.penalty || 0}</div>
                      
                      <div className="text-muted-foreground">Дополжить</div>
                      <div className="font-semibold text-right">0,00 ₽</div>
                    </div>
                    
                    <div className="border-t pt-2 mt-2">
                      <div className="grid grid-cols-2 gap-2 text-sm font-bold">
                        <div>Итог</div>
                        <div className="text-right text-green-600">{salary.rubles} ₽</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 border-t pt-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">StripChat</div>
                      <div className="font-semibold text-right">{salary.totalCheck > 0 ? Math.round((parseInt(calc.stripchat || '0') * 0.05 / salary.totalCheck) * 100) : 0}%</div>
                    </div>
                    <Input
                      type="text"
                      placeholder="Токены StripChat"
                      value={calc.stripchat || ''}
                      onChange={(e) => handleInputChange(user.email, 'stripchat', e.target.value)}
                      className="text-center"
                    />
                    
                    <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                      <div className="text-muted-foreground">Chaturbate</div>
                      <div className="font-semibold text-right">{salary.totalCheck > 0 ? Math.round((parseInt(calc.chaturbate || '0') * 0.05 / salary.totalCheck) * 100) : 0}%</div>
                    </div>
                    <Input
                      type="text"
                      placeholder="Токены Chaturbate"
                      value={calc.chaturbate || ''}
                      onChange={(e) => handleInputChange(user.email, 'chaturbate', e.target.value)}
                      className="text-center"
                    />

                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <Input
                        type="text"
                        placeholder="Аванс"
                        value={calc.advance || ''}
                        onChange={(e) => handleInputChange(user.email, 'advance', e.target.value)}
                        className="text-center"
                      />
                      <Input
                        type="text"
                        placeholder="Штраф"
                        value={calc.penalty || ''}
                        onChange={(e) => handleInputChange(user.email, 'penalty', e.target.value)}
                        className="text-center"
                      />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Icon name="Briefcase" size={24} />
            Продюсеры
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {producers.map(user => {
              const calc = calculations[user.email] || {};
              const salary = calculateSalary(user.email, user.role);
              return (
                <Card key={user.id} className="p-4 bg-cyan-500/5 border-cyan-500/20">
                  <h4 className="font-bold text-lg mb-3 text-center">{user.fullName || user.email}</h4>
                  
                  <div className="space-y-2 mb-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">Сумма $</div>
                      <div className="font-semibold text-right">{salary.dollars}</div>
                      
                      <div className="text-muted-foreground">Курс</div>
                      <div className="font-semibold text-right">{exchangeRate}</div>
                      
                      <div className="text-muted-foreground">Сумма ₽</div>
                      <div className="font-semibold text-right">{salary.rubles} ₽</div>
                      
                      <div className="text-muted-foreground">Аванс</div>
                      <div className="font-semibold text-right">{calc.advance || 0}</div>
                      
                      <div className="text-muted-foreground">Штраф</div>
                      <div className="font-semibold text-right">{calc.penalty || 0}</div>
                      
                      <div className="text-muted-foreground">Дополжить</div>
                      <div className="font-semibold text-right">0,00 ₽</div>
                    </div>
                    
                    <div className="border-t pt-2 mt-2">
                      <div className="grid grid-cols-2 gap-2 text-sm font-bold">
                        <div>Итог</div>
                        <div className="text-right text-green-600">{salary.rubles} ₽</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 border-t pt-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">StripChat</div>
                      <div className="font-semibold text-right">{salary.totalCheck > 0 ? Math.round((parseInt(calc.stripchat || '0') * 0.05 / salary.totalCheck) * 100) : 0}%</div>
                    </div>
                    <Input
                      type="text"
                      placeholder="Токены StripChat"
                      value={calc.stripchat || ''}
                      onChange={(e) => handleInputChange(user.email, 'stripchat', e.target.value)}
                      className="text-center"
                    />
                    
                    <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                      <div className="text-muted-foreground">Chaturbate</div>
                      <div className="font-semibold text-right">{salary.totalCheck > 0 ? Math.round((parseInt(calc.chaturbate || '0') * 0.05 / salary.totalCheck) * 100) : 0}%</div>
                    </div>
                    <Input
                      type="text"
                      placeholder="Токены Chaturbate"
                      value={calc.chaturbate || ''}
                      onChange={(e) => handleInputChange(user.email, 'chaturbate', e.target.value)}
                      className="text-center"
                    />

                    <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                      <div className="text-muted-foreground">CamSoda</div>
                      <div className="font-semibold text-right">{salary.totalCheck > 0 ? Math.round((parseInt(calc.camsoda || '0') * 0.05 / salary.totalCheck) * 100) : 0}%</div>
                    </div>
                    <Input
                      type="text"
                      placeholder="Токены CamSoda"
                      value={calc.camsoda || ''}
                      onChange={(e) => handleInputChange(user.email, 'camsoda', e.target.value)}
                      className="text-center"
                    />

                    <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                      <div className="text-muted-foreground">Cam4</div>
                      <div className="font-semibold text-right">{salary.totalCheck > 0 ? Math.round((parseInt(calc.cam4 || '0') / salary.totalCheck) * 100) : 0}%</div>
                    </div>
                    <Input
                      type="text"
                      placeholder="Сумма Cam4 ($)"
                      value={calc.cam4 || ''}
                      onChange={(e) => handleInputChange(user.email, 'cam4', e.target.value)}
                      className="text-center"
                    />

                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <Input
                        type="text"
                        placeholder="Аванс"
                        value={calc.advance || ''}
                        onChange={(e) => handleInputChange(user.email, 'advance', e.target.value)}
                        className="text-center"
                      />
                      <Input
                        type="text"
                        placeholder="Штраф"
                        value={calc.penalty || ''}
                        onChange={(e) => handleInputChange(user.email, 'penalty', e.target.value)}
                        className="text-center"
                      />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(CalculationTab);