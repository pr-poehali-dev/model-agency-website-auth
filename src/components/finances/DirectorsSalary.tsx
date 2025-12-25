import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Period } from '@/utils/periodUtils';

interface ModelStats {
  name: string;
  email: string;
  current_income: number;
  is_solo_maker: boolean;
  solo_percentage: number;
}

interface ProducerData {
  models: ModelStats[];
}

interface Director {
  name: string;
  salary: number;
}

interface DirectorsSalaryProps {
  userEmail: string;
  period: Period;
  onPreviousPeriod: () => void;
  onNextPeriod: () => void;
}

const DirectorsSalary = ({ userEmail, period, onPreviousPeriod, onNextPeriod }: DirectorsSalaryProps) => {
  const [producersData, setProducersData] = useState<ProducerData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDirectorStats = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://functions.poehali.dev/d82439a1-a9ac-4798-a02a-8874ce48e24b?role=director&email=${encodeURIComponent(userEmail)}&period_start=${period.start}&period_end=${period.end}`
        );
        const data = await response.json();
        if (data.producers) {
          setProducersData(data.producers);
        }
      } catch (error) {
        console.error('Error fetching director stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDirectorStats();
  }, [userEmail, period]);

  // Получаем курс доллара из настроек
  const usdRateStr = localStorage.getItem('usd_to_rub_rate') || '95';
  const USD_TO_RUB = parseFloat(usdRateStr);

  // Рассчитываем доход директоров с учетом соло-мейкеров
  let totalModelsIncomeUSD = 0;
  let totalDirectorsIncomeUSD = 0;

  producersData.forEach(producer => {
    producer.models.forEach(model => {
      const modelIncomeUSD = model.current_income;
      totalModelsIncomeUSD += modelIncomeUSD;

      if (model.is_solo_maker && model.solo_percentage > 0) {
        // Для соло-мейкеров: директора получают (100 - solo_percentage)%
        const directorsPercentage = 100 - model.solo_percentage;
        totalDirectorsIncomeUSD += modelIncomeUSD * (directorsPercentage / 100);
      } else {
        // Для обычных моделей: директора получают 40%
        totalDirectorsIncomeUSD += modelIncomeUSD * 0.4;
      }
    });
  });

  // Конвертируем в рубли
  const totalModelsIncome = totalModelsIncomeUSD * USD_TO_RUB;
  const totalDirectorsIncome = totalDirectorsIncomeUSD * USD_TO_RUB;
  
  // Каждый директор получает 50% от общего дохода директоров
  const directorSalary = totalDirectorsIncome * 0.5;

  const displayDirectors: Director[] = [
    { name: 'Директор Юрий', salary: directorSalary },
    { name: 'Директор Александр', salary: directorSalary }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold mb-1">Зарплата директоров</h3>
          <p className="text-sm text-muted-foreground">
            {period.start} - {period.end}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={onPreviousPeriod}
          >
            <Icon name="ChevronLeft" size={16} />
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onNextPeriod}
          >
            <Icon name="ChevronRight" size={16} />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {displayDirectors.map((director, index) => (
          <Card key={index} className="p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon name="UserCog" size={24} className="text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-lg mb-1">{director.name}</h4>
                  <p className="text-2xl font-bold text-primary">
                    {director.salary.toLocaleString('ru-RU')} ₽
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Общий доход моделей:</span>
                <span className="font-medium">{totalModelsIncome.toLocaleString('ru-RU')} ₽</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Доля директоров (40%):</span>
                <span className="font-medium">{totalDirectorsIncome.toLocaleString('ru-RU')} ₽</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Доля директора (50%):</span>
                <span className="font-medium">{director.salary.toLocaleString('ru-RU')} ₽</span>
              </div>
              <div className="flex items-center justify-between text-sm pt-2 border-t">
                <span className="text-muted-foreground font-medium">Итого к выплате:</span>
                <span className="font-bold text-primary">{director.salary.toLocaleString('ru-RU')} ₽</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DirectorsSalary;