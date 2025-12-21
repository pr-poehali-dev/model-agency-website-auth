import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface ModelStats {
  name: string;
  email: string;
  current_income: number;
}

interface ProducerData {
  models: ModelStats[];
}

interface Director {
  name: string;
  salary: number;
}

interface DirectorsSalaryProps {
  producersData: ProducerData[];
}

const DirectorsSalary = ({ producersData }: DirectorsSalaryProps) => {
  // Рассчитываем общий доход всех моделей в долларах
  const totalModelsIncomeUSD = producersData.reduce((total, producer) => {
    return total + producer.models.reduce((sum, model) => sum + model.current_income, 0);
  }, 0);

  // Курс доллара (можно вынести в настройки)
  const USD_TO_RUB = 95;

  // Конвертируем в рубли
  const totalModelsIncome = totalModelsIncomeUSD * USD_TO_RUB;

  // Каждый директор получает 20% от общего дохода в рублях
  const directorSalary = totalModelsIncome * 0.2;

  const displayDirectors: Director[] = [
    { name: 'Директор Юрий', salary: directorSalary },
    { name: 'Директор Александр', salary: directorSalary }
  ];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold mb-1">Зарплата директоров</h3>
        <p className="text-sm text-muted-foreground"></p>
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
                <span className="text-muted-foreground">Процент директора:</span>
                <span className="font-medium">20%</span>
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