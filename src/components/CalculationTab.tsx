import { useState, useEffect, memo } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { authenticatedFetch } from '@/lib/api';

interface User {
  id: number;
  email: string;
  fullName: string;
  role: string;
  soloPercentage?: string;
}

const USERS_API_URL = 'https://functions.poehali.dev/67fd6902-6170-487e-bb46-f6d14ec99066';
const ADJUSTMENTS_API_URL = 'https://functions.poehali.dev/d43e7388-65e1-4856-9631-1a460d38abd7';

interface SoloModel {
  id: string;
  email: string;
  name: string;
  stripchat: string;
  chaturbate: string;
  camsoda: string;
  advance: string;
  penalty: string;
  percentage: string;
}

const CalculationTab = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [exchangeRate, setExchangeRate] = useState(74.23);
  const [adjustments, setAdjustments] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [soloModels, setSoloModels] = useState<SoloModel[]>([]);
  const [calculations, setCalculations] = useState<Record<string, {
    stripchat: string;
    chaturbate: string;
    camsoda: string;
    advance: string;
    penalty: string;
    expenses?: string;
  }>>({});

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        loadUsers(),
        loadExchangeRate(),
        loadAdjustments()
      ]);
      
      const savedSoloModels = localStorage.getItem('soloModels');
      if (savedSoloModels) {
        setSoloModels(JSON.parse(savedSoloModels));
      }
      
      setLoading(false);
    };
    loadData();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await authenticatedFetch(USERS_API_URL);
      
      if (!response.ok) {
        console.error('Failed to load users: HTTP', response.status);
        return;
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data)) {
        console.error('Invalid users response:', data);
        return;
      }
      
      const employees = data.filter((u: User) => 
        u.role === 'operator' || u.role === 'content_maker' || u.role === 'producer' || u.role === 'solo_maker'
      );
      setUsers(employees);
      
      const savedCalculations = localStorage.getItem('calculationTabData');
      const savedData = savedCalculations ? JSON.parse(savedCalculations) : {};
      
      const initialCalc: Record<string, any> = {};
      employees.forEach((user: User) => {
        initialCalc[user.email] = savedData[user.email] || {
          stripchat: '0',
          chaturbate: '0',
          camsoda: '0',
          transfers: '0',
          advance: '0',
          penalty: '0',
          expenses: '0'
        };
      });
      setCalculations(initialCalc);
    } catch (err) {
      console.error('Failed to load users', err);
    }
  };

  const loadExchangeRate = async () => {
    try {
      const response = await authenticatedFetch('https://functions.poehali.dev/be3de232-e5c9-421e-8335-c4f67a2d744a');
      
      if (!response.ok) {
        console.error('Failed to load exchange rate: HTTP', response.status);
        return;
      }
      
      const data = await response.json();
      if (data.rate) {
        setExchangeRate(data.rate - 5);
      }
    } catch (err) {
      console.error('Failed to load exchange rate', err);
    }
  };

  const loadAdjustments = async () => {
    try {
      const today = new Date();
      const dayOfMonth = today.getDate();
      
      let periodStart: Date;
      let periodEnd: Date;
      
      if (dayOfMonth >= 1 && dayOfMonth <= 15) {
        periodStart = new Date(today.getFullYear(), today.getMonth(), 1);
        periodEnd = new Date(today.getFullYear(), today.getMonth(), 15);
      } else {
        periodStart = new Date(today.getFullYear(), today.getMonth(), 16);
        periodEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      }
      
      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const periodStartStr = formatDate(periodStart);
      const periodEndStr = formatDate(periodEnd);
      
      const response = await authenticatedFetch(`${ADJUSTMENTS_API_URL}?period_start=${periodStartStr}&period_end=${periodEndStr}`);
      
      if (!response.ok) {
        console.error('Failed to load adjustments: HTTP', response.status);
        return;
      }
      
      const data = await response.json();
      setAdjustments(data);
        
      setCalculations(prev => {
        const updated = { ...prev };
        Object.keys(data).forEach(email => {
          if (updated[email]) {
            const user = users.find(u => u.email === email);
            if (user?.role === 'producer') {
              updated[email] = {
                ...updated[email],
                advance: String(data[email].advance || 0),
                penalty: String(data[email].penalty || 0),
                expenses: String(data[email].expenses || 0)
              };
            } else {
              updated[email] = {
                ...updated[email],
                advance: String(data[email].advance || 0),
                penalty: String(data[email].penalty || 0)
              };
            }
          }
        });
        return updated;
      });
    } catch (err) {
      console.error('Failed to load adjustments', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAdjustments();
    setRefreshing(false);
  };

  const handleClearData = () => {
    if (confirm('Очистить все введенные токены? Аванс и штраф останутся без изменений.')) {
      setCalculations(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(email => {
          updated[email] = {
            ...updated[email],
            stripchat: '0',
            chaturbate: '0',
            transfers: '0'
          };
        });
        localStorage.setItem('calculationTabData', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const handleInputChange = (email: string, field: string, value: string) => {
    const numValue = field === 'transfers' ? value.replace(/[^0-9.]/g, '') : value.replace(/[^0-9]/g, '');
    setCalculations(prev => {
      const updated = {
        ...prev,
        [email]: {
          ...prev[email],
          [field]: numValue
        }
      };
      localStorage.setItem('calculationTabData', JSON.stringify(updated));
      return updated;
    });
  };

  const calculateSalary = (email: string, role: string) => {
    const calc = calculations[email];
    if (!calc) return { dollars: 0, rubles: 0 };

    const stripchat = parseInt(calc.stripchat || '0');
    const chaturbate = parseInt(calc.chaturbate || '0');
    const camsoda = parseInt(calc.camsoda || '0');
    const transfers = parseFloat(calc.transfers || '0');
    const advance = parseInt(calc.advance || '0');
    const penalty = parseInt(calc.penalty || '0');
    const expenses = parseInt(calc.expenses || '0');

    const stripchatDollars = stripchat * 0.05;
    const chaturbateDollars = chaturbate * 0.05;
    const camsodaDollars = camsoda * 0.05;
    const totalCheck = stripchatDollars + chaturbateDollars + camsodaDollars + transfers;

    let salaryDollars = 0;
    if (role === 'content_maker') {
      salaryDollars = totalCheck * 0.3;
    } else if (role === 'operator') {
      salaryDollars = totalCheck * 0.2;
    } else if (role === 'producer') {
      salaryDollars = (stripchatDollars * 0.1) + (chaturbateDollars * 0.3) + (camsodaDollars * 0.2) + (transfers * 0.2);
    }

    let salaryRubles = 0;
    if (role === 'producer') {
      salaryRubles = (salaryDollars * exchangeRate) + expenses - advance - penalty;
    } else {
      salaryRubles = (salaryDollars * exchangeRate) - advance - penalty;
    }

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

  const totalSolo = soloModels.reduce((sum, solo) => {
    const stripchat = parseInt(solo.stripchat || '0');
    const chaturbate = parseInt(solo.chaturbate || '0');
    const camsoda = parseInt(solo.camsoda || '0');
    const advance = parseInt(solo.advance || '0');
    const penalty = parseInt(solo.penalty || '0');
    const percentage = parseInt(solo.percentage || '50');
    const stripchatDollars = stripchat * 0.05;
    const chaturbateDollars = chaturbate * 0.05;
    const camsodaDollars = camsoda * 0.05;
    const totalCheck = stripchatDollars + chaturbateDollars + camsodaDollars;
    const salaryDollars = totalCheck * (percentage / 100);
    const salaryRubles = (salaryDollars * exchangeRate) - advance - penalty;
    return sum + salaryRubles;
  }, 0);
  
  const totalAll = totalOperators + totalModels + totalProducers + totalSolo;

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-serif font-bold text-foreground mb-2">Подсчёт зарплат</h2>
          <p className="text-muted-foreground">Загрузка данных...</p>
        </div>
        <Card className="p-12">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Загружаем данные из раздела "Чеки"...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Icon name="Loader2" size={48} className="animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-serif font-bold text-foreground mb-2">Подсчёт зарплат</h2>
          <p className="text-muted-foreground">Ручной расчёт по токенам для проверки</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleClearData}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Icon name="Trash2" size={16} />
            Очистить токены
          </Button>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Icon name={refreshing ? "Loader2" : "RefreshCw"} size={16} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Обновление..." : "Обновить данные"}
          </Button>
        </div>
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
        {producers.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 text-cyan-400">Продюсеры</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {producers.map(user => {
                const calc = calculations[user.email] || {};
                const salary = calculateSalary(user.email, user.role);
                return (
                  <Card key={user.id} className="p-3 bg-cyan-500/5 border-cyan-500/20">
                    <h4 className="font-semibold mb-2 text-center text-sm">{user.fullName || user.email}</h4>
                    
                    <div className="space-y-1.5 mb-2">
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <div className="text-muted-foreground">Чек $ / 10%</div>
                        <div className="font-semibold text-right">${salary.totalCheck} / ${salary.dollars}</div>
                        
                        <div className="text-muted-foreground">Курс / ₽</div>
                        <div className="font-semibold text-right">{exchangeRate} / {Math.round(salary.dollars * exchangeRate)} ₽</div>
                        
                        <div className="text-muted-foreground">Затраты</div>
                        <div className="font-semibold text-right text-green-600">+{calc.expenses || 0} ₽</div>
                        
                        <div className="text-muted-foreground">Аванс / Штраф</div>
                        <div className="font-semibold text-right text-red-600">-{calc.advance || 0} / -{calc.penalty || 0} ₽</div>
                      </div>
                      
                      <div className="border-t pt-1.5">
                        <div className="grid grid-cols-2 gap-1 text-xs font-bold">
                          <div>Итог</div>
                          <div className="text-right text-green-600">{salary.rubles} ₽</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 border-t pt-2">
                      <Input
                        type="text"
                        placeholder="StripChat"
                        value={calc.stripchat || ''}
                        onChange={(e) => handleInputChange(user.email, 'stripchat', e.target.value)}
                        className="text-center text-xs h-8"
                      />
                      <Input
                        type="text"
                        placeholder="Chaturbate"
                        value={calc.chaturbate || ''}
                        onChange={(e) => handleInputChange(user.email, 'chaturbate', e.target.value)}
                        className="text-center text-xs h-8"
                      />
                      <Input
                        type="text"
                        placeholder="CamSoda"
                        value={calc.camsoda || ''}
                        onChange={(e) => handleInputChange(user.email, 'camsoda', e.target.value)}
                        className="text-center text-xs h-8"
                      />
                      <Input
                        type="text"
                        placeholder="Переводы $"
                        value={calc.transfers || ''}
                        onChange={(e) => handleInputChange(user.email, 'transfers', e.target.value)}
                        className="text-center text-xs h-8"
                      />
                      <Input
                        type="text"
                        placeholder="Затраты"
                        value={calc.expenses || ''}
                        onChange={(e) => handleInputChange(user.email, 'expenses', e.target.value)}
                        className="text-center bg-green-500/10 text-green-600 font-semibold text-xs h-8"
                      />
                      <div className="grid grid-cols-2 gap-1.5">
                        <Input
                          type="text"
                          placeholder="Аванс"
                          value={calc.advance || ''}
                          onChange={(e) => handleInputChange(user.email, 'advance', e.target.value)}
                          className="text-center bg-red-500/10 text-red-600 font-semibold text-xs h-8"
                        />
                        <Input
                          type="text"
                          placeholder="Штраф"
                          value={calc.penalty || ''}
                          onChange={(e) => handleInputChange(user.email, 'penalty', e.target.value)}
                          className="text-center bg-red-500/10 text-red-600 font-semibold text-xs h-8"
                        />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {operators.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Операторы</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {operators.map(user => {
                const calc = calculations[user.email] || {};
                const salary = calculateSalary(user.email, user.role);
                return (
                  <Card key={user.id} className="p-3">
                    <h4 className="font-semibold mb-2 text-center text-sm">{user.fullName || user.email}</h4>
                  
                    <div className="space-y-1.5 mb-2">
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <div className="text-muted-foreground">Чек $ / 20%</div>
                        <div className="font-semibold text-right">${salary.totalCheck} / ${salary.dollars}</div>
                        
                        <div className="text-muted-foreground">Курс / ₽</div>
                        <div className="font-semibold text-right">{exchangeRate} / {Math.round(salary.dollars * exchangeRate)} ₽</div>
                        
                        <div className="text-muted-foreground">Аванс / Штраф</div>
                        <div className="font-semibold text-right text-red-600">-{calc.advance || 0} / -{calc.penalty || 0} ₽</div>
                      </div>
                      
                      <div className="border-t pt-1.5">
                        <div className="grid grid-cols-2 gap-1 text-xs font-bold">
                          <div>Итог</div>
                          <div className="text-right text-green-600">{salary.rubles} ₽</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 border-t pt-2">
                      <Input
                        type="text"
                        placeholder="StripChat"
                        value={calc.stripchat || ''}
                        onChange={(e) => handleInputChange(user.email, 'stripchat', e.target.value)}
                        className="text-center text-xs h-8"
                      />
                      <Input
                        type="text"
                        placeholder="Chaturbate"
                        value={calc.chaturbate || ''}
                        onChange={(e) => handleInputChange(user.email, 'chaturbate', e.target.value)}
                        className="text-center text-xs h-8"
                      />
                      <Input
                        type="text"
                        placeholder="Переводы $"
                        value={calc.transfers || ''}
                        onChange={(e) => handleInputChange(user.email, 'transfers', e.target.value)}
                        className="text-center text-xs h-8"
                      />
                      <div className="grid grid-cols-2 gap-1.5">
                        <Input
                          type="text"
                          placeholder="Аванс"
                          value={calc.advance || ''}
                          onChange={(e) => handleInputChange(user.email, 'advance', e.target.value)}
                          className="text-center bg-red-500/10 text-red-600 font-semibold text-xs h-8"
                        />
                        <Input
                          type="text"
                          placeholder="Штраф"
                          value={calc.penalty || ''}
                          onChange={(e) => handleInputChange(user.email, 'penalty', e.target.value)}
                          className="text-center bg-red-500/10 text-red-600 font-semibold text-xs h-8"
                        />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {models.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 text-yellow-400">Мейкеры</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {models.map(user => {
                const calc = calculations[user.email] || {};
                const salary = calculateSalary(user.email, user.role);
                return (
                  <Card key={user.id} className="p-3 bg-yellow-500/5 border-yellow-500/20">
                    <h4 className="font-semibold mb-2 text-center text-sm">{user.fullName || user.email}</h4>
                    
                    <div className="space-y-1.5 mb-2">
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        <div className="text-muted-foreground">Чек $ / 30%</div>
                        <div className="font-semibold text-right">${salary.totalCheck} / ${salary.dollars}</div>
                        
                        <div className="text-muted-foreground">Курс / ₽</div>
                        <div className="font-semibold text-right">{exchangeRate} / {Math.round(salary.dollars * exchangeRate)} ₽</div>
                        
                        <div className="text-muted-foreground">Аванс / Штраф</div>
                        <div className="font-semibold text-right text-red-600">-{calc.advance || 0} / -{calc.penalty || 0} ₽</div>
                      </div>
                      
                      <div className="border-t pt-1.5">
                        <div className="grid grid-cols-2 gap-1 text-xs font-bold">
                          <div>Итог</div>
                          <div className="text-right text-green-600">{salary.rubles} ₽</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 border-t pt-2">
                      <Input
                        type="text"
                        placeholder="StripChat"
                        value={calc.stripchat || ''}
                        onChange={(e) => handleInputChange(user.email, 'stripchat', e.target.value)}
                        className="text-center text-xs h-8"
                      />
                      <Input
                        type="text"
                        placeholder="Chaturbate"
                        value={calc.chaturbate || ''}
                        onChange={(e) => handleInputChange(user.email, 'chaturbate', e.target.value)}
                        className="text-center text-xs h-8"
                      />
                      <Input
                        type="text"
                        placeholder="CamSoda"
                        value={calc.camsoda || ''}
                        onChange={(e) => handleInputChange(user.email, 'camsoda', e.target.value)}
                        className="text-center text-xs h-8"
                      />
                      <Input
                        type="text"
                        placeholder="Переводы $"
                        value={calc.transfers || ''}
                        onChange={(e) => handleInputChange(user.email, 'transfers', e.target.value)}
                        className="text-center text-xs h-8"
                      />
                      <div className="grid grid-cols-2 gap-1.5">
                        <Input
                          type="text"
                          placeholder="Аванс"
                          value={calc.advance || ''}
                          onChange={(e) => handleInputChange(user.email, 'advance', e.target.value)}
                          className="text-center bg-red-500/10 text-red-600 font-semibold text-xs h-8"
                        />
                        <Input
                          type="text"
                          placeholder="Штраф"
                          value={calc.penalty || ''}
                          onChange={(e) => handleInputChange(user.email, 'penalty', e.target.value)}
                          className="text-center bg-red-500/10 text-red-600 font-semibold text-xs h-8"
                        />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-purple-400">Соло</h3>
            <select
              onChange={(e) => {
                if (!e.target.value) return;
                const user = users.find(u => u.email === e.target.value);
                if (!user) return;
                
                if (soloModels.find(s => s.email === user.email)) {
                  alert('Этот соло-мейкер уже добавлен');
                  e.target.value = '';
                  return;
                }
                
                const newSolo: SoloModel = {
                  id: `solo-${Date.now()}`,
                  email: user.email,
                  name: user.fullName,
                  stripchat: '0',
                  chaturbate: '0',
                  advance: '0',
                  penalty: '0',
                  percentage: user.soloPercentage || '50'
                };
                const updated = [...soloModels, newSolo];
                setSoloModels(updated);
                localStorage.setItem('soloModels', JSON.stringify(updated));
                e.target.value = '';
              }}
              className="px-3 py-1.5 text-sm rounded-md border border-border bg-background"
            >
              <option value="">+ Добавить соло-мейкера</option>
              {users.filter(u => u.role === 'solo_maker').map(u => (
                <option key={u.email} value={u.email}>{u.fullName}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {soloModels.map(solo => {
              const stripchat = parseInt(solo.stripchat || '0');
              const chaturbate = parseInt(solo.chaturbate || '0');
              const advance = parseInt(solo.advance || '0');
              const penalty = parseInt(solo.penalty || '0');
              const percentage = parseInt(solo.percentage || '50');
              
              const stripchatDollars = stripchat * 0.05;
              const chaturbateDollars = chaturbate * 0.05;
              const totalCheck = stripchatDollars + chaturbateDollars;
              const salaryDollars = totalCheck * (percentage / 100);
              const salaryRubles = (salaryDollars * exchangeRate) - advance - penalty;
              
              return (
                <Card key={solo.id} className="p-3 bg-purple-500/5 border-purple-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold text-purple-600 flex-1">
                      {solo.name}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const updated = soloModels.filter(s => s.id !== solo.id);
                        setSoloModels(updated);
                        localStorage.setItem('soloModels', JSON.stringify(updated));
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <Icon name="X" size={14} />
                    </Button>
                  </div>
                  
                  <div className="space-y-1.5 mb-2">
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div className="text-muted-foreground">Чек $ / {percentage}%</div>
                      <div className="font-semibold text-right">${Math.round(totalCheck * 100) / 100} / ${Math.round(salaryDollars * 100) / 100}</div>
                      
                      <div className="text-muted-foreground">Курс / ₽</div>
                      <div className="font-semibold text-right">{exchangeRate} / {Math.round(salaryDollars * exchangeRate)} ₽</div>
                      
                      <div className="text-muted-foreground">Аванс / Штраф</div>
                      <div className="font-semibold text-right text-red-600">-{advance} / -{penalty} ₽</div>
                    </div>
                    
                    <div className="border-t pt-1.5">
                      <div className="grid grid-cols-2 gap-1 text-xs font-bold">
                        <div>Итог</div>
                        <div className="text-right text-green-600">{Math.round(salaryRubles * 100) / 100} ₽</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 border-t pt-2">
                    <div className="text-center text-xs text-muted-foreground mb-1">
                      Процент: <span className="font-semibold text-purple-600">{solo.percentage}%</span>
                    </div>
                    <Input
                      type="text"
                      placeholder="StripChat"
                      value={solo.stripchat}
                      onChange={(e) => {
                        const numValue = e.target.value.replace(/[^0-9]/g, '');
                        const updated = soloModels.map(s => 
                          s.id === solo.id ? { ...s, stripchat: numValue } : s
                        );
                        setSoloModels(updated);
                        localStorage.setItem('soloModels', JSON.stringify(updated));
                      }}
                      className="text-center text-xs h-8"
                    />
                    <Input
                      type="text"
                      placeholder="Chaturbate"
                      value={solo.chaturbate}
                      onChange={(e) => {
                        const numValue = e.target.value.replace(/[^0-9]/g, '');
                        const updated = soloModels.map(s => 
                          s.id === solo.id ? { ...s, chaturbate: numValue } : s
                        );
                        setSoloModels(updated);
                        localStorage.setItem('soloModels', JSON.stringify(updated));
                      }}
                      className="text-center text-xs h-8"
                    />
                    <Input
                      type="text"
                      placeholder="CamSoda"
                      value={solo.camsoda}
                      onChange={(e) => {
                        const numValue = e.target.value.replace(/[^0-9]/g, '');
                        const updated = soloModels.map(s => 
                          s.id === solo.id ? { ...s, camsoda: numValue } : s
                        );
                        setSoloModels(updated);
                        localStorage.setItem('soloModels', JSON.stringify(updated));
                      }}
                      className="text-center text-xs h-8"
                    />
                    <div className="grid grid-cols-2 gap-1.5">
                      <Input
                        type="text"
                        placeholder="Аванс"
                        value={solo.advance}
                        onChange={(e) => {
                          const numValue = e.target.value.replace(/[^0-9]/g, '');
                          const updated = soloModels.map(s => 
                            s.id === solo.id ? { ...s, advance: numValue } : s
                          );
                          setSoloModels(updated);
                          localStorage.setItem('soloModels', JSON.stringify(updated));
                        }}
                        className="text-center bg-red-500/10 text-red-600 font-semibold text-xs h-8"
                      />
                      <Input
                        type="text"
                        placeholder="Штраф"
                        value={solo.penalty}
                        onChange={(e) => {
                          const numValue = e.target.value.replace(/[^0-9]/g, '');
                          const updated = soloModels.map(s => 
                            s.id === solo.id ? { ...s, penalty: numValue } : s
                          );
                          setSoloModels(updated);
                          localStorage.setItem('soloModels', JSON.stringify(updated));
                        }}
                        className="text-center bg-red-500/10 text-red-600 font-semibold text-xs h-8"
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