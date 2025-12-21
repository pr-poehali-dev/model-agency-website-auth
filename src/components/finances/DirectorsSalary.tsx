import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface Director {
  name: string;
  salary: number;
}

interface DirectorsSalaryProps {
  directors?: Director[];
}

const DirectorsSalary = ({ directors }: DirectorsSalaryProps) => {
  const defaultDirectors: Director[] = [
    { name: 'Директор Юрий', salary: 0 },
    { name: 'Директор Александр', salary: 0 }
  ];

  const displayDirectors = directors && directors.length > 0 ? directors : defaultDirectors;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold mb-1">Зарплата директоров</h3>
        <p className="text-sm text-muted-foreground"></p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {displayDirectors.map((director, index) => (
          <Card key={index} className="p-6">
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
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DirectorsSalary;