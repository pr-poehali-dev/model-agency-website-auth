import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import BlockedDatesManager from './finances/BlockedDatesManager';

interface SettingsTabProps {
  userEmail?: string;
  userRole?: string;
}

const SettingsTab = ({ userEmail = '', userRole = '' }: SettingsTabProps) => {
  const [usdRate, setUsdRate] = useState('95');
  const { toast } = useToast();

  useEffect(() => {
    const savedRate = localStorage.getItem('usd_to_rub_rate');
    if (savedRate) {
      setUsdRate(savedRate);
    }
  }, []);

  const handleSave = () => {
    const rate = parseFloat(usdRate);
    if (isNaN(rate) || rate <= 0) {
      toast({
        title: 'Ошибка',
        description: 'Введите корректный курс валюты',
        variant: 'destructive'
      });
      return;
    }

    localStorage.setItem('usd_to_rub_rate', usdRate);
    toast({
      title: 'Сохранено',
      description: 'Курс валюты обновлен'
    });
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-3xl font-serif font-bold mb-2">Настройки</h2>
        <p className="text-muted-foreground">Управление параметрами системы</p>
      </div>

      <Card className="p-6 space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-4">Курсы валют</h3>
          <div className="space-y-4">
            <div className="flex items-end gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">Курс USD → RUB</label>
                <div className="relative">
                  <Input
                    type="number"
                    value={usdRate}
                    onChange={(e) => setUsdRate(e.target.value)}
                    placeholder="95"
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    ₽
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Используется для расчета зарплаты директоров
                </p>
              </div>
              <Button onClick={handleSave} className="gap-2">
                <Icon name="Save" size={16} />
                Сохранить
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {userRole === 'director' && (
        <BlockedDatesManager userEmail={userEmail} />
      )}
    </div>
  );
};

export default SettingsTab;