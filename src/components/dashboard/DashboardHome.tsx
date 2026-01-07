import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface Model {
  id: number;
  name: string;
  email?: string;
  image: string;
  height: string;
  bust: string;
  waist: string;
  hips: string;
  experience: string;
  specialty: string;
  status: string;
}

interface DashboardHomeProps {
  models: Model[];
  userRole?: string | null;
  onNavigate?: (tab: string) => void;
}

const DashboardHome = ({ models, userRole, onNavigate }: DashboardHomeProps) => {
  const [cbrRate, setCbrRate] = useState<number | null>(null);
  const [workingRate, setWorkingRate] = useState<number | null>(null);
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (userRole === 'director') {
      loadExchangeRate();
      loadAssignments();
      loadUsers();
    }
  }, [userRole]);

  const loadAssignments = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/b7d8dd69-ab09-460d-999b-c0a1002ced30');
      const data = await response.json();
      setAssignments(data);
    } catch (err) {
      console.error('Failed to load assignments', err);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/67fd6902-6170-487e-bb46-f6d14ec99066');
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users', err);
    }
  };

  const loadExchangeRate = async () => {
    setIsLoadingRate(true);
    try {
      const response = await fetch('https://functions.poehali.dev/be3de232-e5c9-421e-8335-c4f67a2d744a');
      const data = await response.json();
      if (data.rate) {
        const cbr = data.rate;
        const working = cbr - 5;
        setCbrRate(cbr);
        setWorkingRate(working);
      }
    } catch (err) {
      console.error('Failed to load exchange rate from CBR', err);
    } finally {
      setIsLoadingRate(false);
    }
  };

  const totalModels = users.filter(u => u.role === 'content_maker' || u.role === 'solo_maker').length;
  
  const modelsWithOperators = new Set(assignments.map(a => a.modelEmail));
  const soloMakers = users.filter(u => u.role === 'solo_maker').map(u => u.email);
  const activeModelsEmails = new Set([...modelsWithOperators, ...soloMakers]);
  const activeModelsCount = activeModelsEmails.size;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-serif font-bold text-foreground mb-2">Главная</h2>
        <p className="text-muted-foreground"></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-gradient-to-br from-accent/10 to-primary/10 border-accent/20">
          <div className="flex items-center mb-4">
            <Icon name="Users" size={24} className="text-accent" />
          </div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Всего моделей</h3>
          <p className="text-3xl font-serif font-bold text-foreground">{totalModels}</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-primary/20 rounded-lg">
              <Icon name="CheckCircle" size={24} className="text-primary" />
            </div>
            <Badge variant="secondary" className="bg-primary/20 text-primary">С операторами</Badge>
          </div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Активные модели</h3>
          <p className="text-3xl font-serif font-bold text-foreground">{activeModelsCount}</p>
        </Card>
      </div>

      {userRole === 'director' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border-amber-500/20">
              <div className="flex items-center mb-4">
                <Icon name="TrendingUp" size={24} className="text-amber-600" />
              </div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Курс доллара (ЦБ - 5₽)</h3>
              <p className="text-3xl font-serif font-bold text-foreground">
                {isLoadingRate ? '...' : workingRate ? `${workingRate.toFixed(2)} ₽` : '—'}
              </p>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-500/20 rounded-lg">
                  <Icon name="DollarSign" size={24} className="text-orange-600" />
                </div>
                <Badge variant="secondary" className="bg-orange-500/20 text-orange-600">ЦБ РФ</Badge>
              </div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Курс доллара ЦБ</h3>
              <p className="text-3xl font-serif font-bold text-foreground">
                {isLoadingRate ? '...' : cbrRate ? `${cbrRate.toFixed(2)} ₽` : '—'}
              </p>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card 
              className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20 cursor-pointer hover:shadow-lg transition-all group"
              onClick={() => onNavigate?.('finances')}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors">
                  <Icon name="Wallet" size={24} className="text-green-600" />
                </div>
                <Badge variant="secondary" className="bg-green-500/20 text-green-600">Перейти</Badge>
              </div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Финансы</h3>
              <p className="text-3xl font-serif font-bold text-foreground mb-2">Управление</p>
              <p className="text-sm text-muted-foreground">Транзакции и статистика</p>
            </Card>

            <Card 
              className="p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20 cursor-pointer hover:shadow-lg transition-all group"
              onClick={() => onNavigate?.('schedule')}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                  <Icon name="Calendar" size={24} className="text-blue-600" />
                </div>
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-600">Перейти</Badge>
              </div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Расписание</h3>
              <p className="text-3xl font-serif font-bold text-foreground mb-2">Смены</p>
              <p className="text-sm text-muted-foreground">Управление рабочим временем</p>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardHome;