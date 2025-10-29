import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Employee } from './types';
import { Period } from '@/utils/periodUtils';

interface ContentMakersSectionProps {
  contentMakers: Employee[];
  period: Period;
}

const ContentMakersSection = ({ contentMakers, period }: ContentMakersSectionProps) => {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Icon name="UserCircle" size={24} className="text-accent" />
        <h3 className="text-2xl font-serif font-bold">Контент-мейкеры</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {contentMakers.map((employee, index) => (
          <Card key={index} className="overflow-hidden">
            <div className="p-3 bg-purple-500/20 text-center font-bold border-b">
              {employee.name}
            </div>
            <div className="p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Неделя</span>
                <span className="font-medium">{employee.week}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Сумма $</span>
                <span className="font-medium">{employee.sumDollars.toFixed(3)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Курс</span>
                <span className="font-medium">{employee.rate}</span>
              </div>
              <div className="flex justify-between bg-green-500/10 p-2 rounded">
                <span className="font-medium">Сумма ₽</span>
                <span className="font-bold">{employee.sumRubles.toLocaleString()}₽</span>
              </div>
              <div className="flex justify-between bg-yellow-500/10 p-2 rounded">
                <span className="font-medium">Аванс</span>
                <span className="font-bold">{employee.advance}₽</span>
              </div>
              <div className="flex justify-between bg-red-500/10 p-2 rounded">
                <span className="font-medium">Штраф</span>
                <span className="font-bold">{employee.penalty}₽</span>
              </div>
              <div className="flex justify-between bg-green-500/20 p-2 rounded border-t-2 border-green-500">
                <span className="font-bold">Итог</span>
                <span className="font-bold text-lg">{employee.total.toLocaleString()}₽</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ContentMakersSection;