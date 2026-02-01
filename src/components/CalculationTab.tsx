import { useState, useEffect, memo } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { authenticatedFetch } from '@/lib/api';
import OperatorCalculation from './calculation-components/OperatorCalculation';
import ProducerCalculation from './calculation-components/ProducerCalculation';
import SoloMakerCalculation from './calculation-components/SoloMakerCalculation';

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
      dollars: salaryDollars,
      rubles: salaryRubles
    };
  };

  const handleAddSoloModel = () => {
    const newModel: SoloModel = {
      id: Date.now().toString(),
      email: '',
      name: '',
      stripchat: '0',
      chaturbate: '0',
      camsoda: '0',
      advance: '0',
      penalty: '0',
      percentage: '50'
    };
    const updated = [...soloModels, newModel];
    setSoloModels(updated);
    localStorage.setItem('soloModels', JSON.stringify(updated));
  };

  const handleRemoveSoloModel = (id: string) => {
    const updated = soloModels.filter(m => m.id !== id);
    setSoloModels(updated);
    localStorage.setItem('soloModels', JSON.stringify(updated));
  };

  const handleSoloInputChange = (id: string, field: string, value: string) => {
    const numValue = ['stripchat', 'chaturbate', 'camsoda', 'advance', 'penalty', 'percentage'].includes(field) 
      ? value.replace(/[^0-9]/g, '') 
      : value;
    
    const updated = soloModels.map(m => 
      m.id === id ? { ...m, [field]: numValue } : m
    );
    setSoloModels(updated);
    localStorage.setItem('soloModels', JSON.stringify(updated));
  };

  const calculateSoloSalary = (model: SoloModel) => {
    const stripchat = parseInt(model.stripchat || '0');
    const chaturbate = parseInt(model.chaturbate || '0');
    const camsoda = parseInt(model.camsoda || '0');
    const advance = parseInt(model.advance || '0');
    const penalty = parseInt(model.penalty || '0');
    const percentage = parseInt(model.percentage || '50');

    const stripchatDollars = stripchat * 0.05;
    const chaturbateDollars = chaturbate * 0.05;
    const camsodaDollars = camsoda * 0.05;
    const totalCheck = stripchatDollars + chaturbateDollars + camsodaDollars;

    const salaryDollars = totalCheck * (percentage / 100);
    const salaryRubles = (salaryDollars * exchangeRate) - advance - penalty;

    return {
      dollars: salaryDollars,
      rubles: salaryRubles
    };
  };

  if (loading) {
    return (
      <div className="animate-fade-in space-y-6">
        <div>
          <h2 className="text-4xl font-serif font-bold text-foreground mb-2">Подсчёт зарплат</h2>
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-4xl font-serif font-bold text-foreground mb-2">Подсчёт зарплат</h2>
          <p className="text-muted-foreground">Расчет заработной платы команды</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleRefresh} 
            disabled={refreshing}
            variant="outline"
          >
            <Icon name={refreshing ? "Loader2" : "RefreshCw"} size={16} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Обновить аванс/штраф
          </Button>
          <Button 
            onClick={handleClearData}
            variant="outline"
          >
            <Icon name="Trash2" size={16} className="mr-2" />
            Очистить токены
          </Button>
        </div>
      </div>

      <OperatorCalculation
        users={users}
        calculations={calculations}
        exchangeRate={exchangeRate}
        onInputChange={handleInputChange}
        calculateSalary={calculateSalary}
      />

      <ProducerCalculation
        users={users}
        calculations={calculations}
        exchangeRate={exchangeRate}
        onInputChange={handleInputChange}
        calculateSalary={calculateSalary}
      />

      <SoloMakerCalculation
        soloModels={soloModels}
        exchangeRate={exchangeRate}
        onAddModel={handleAddSoloModel}
        onRemoveModel={handleRemoveSoloModel}
        onSoloInputChange={handleSoloInputChange}
        calculateSoloSalary={calculateSoloSalary}
      />
    </div>
  );
};

export default memo(CalculationTab);
