import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

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

interface SoloMakerCalculationProps {
  soloModels: SoloModel[];
  exchangeRate: number;
  onAddModel: () => void;
  onRemoveModel: (id: string) => void;
  onSoloInputChange: (id: string, field: string, value: string) => void;
  calculateSoloSalary: (model: SoloModel) => { dollars: number; rubles: number };
}

const SoloMakerCalculation = ({
  soloModels,
  exchangeRate,
  onAddModel,
  onRemoveModel,
  onSoloInputChange,
  calculateSoloSalary
}: SoloMakerCalculationProps) => {
  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Соло-модели</h3>
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            Курс: {exchangeRate.toFixed(2)} ₽/$
          </div>
          <Button onClick={onAddModel} size="sm">
            <Icon name="Plus" size={16} className="mr-1" />
            Добавить
          </Button>
        </div>
      </div>
      {soloModels.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Нет соло-моделей</p>
          <p className="text-sm mt-1">Нажмите "Добавить" чтобы создать запись</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="p-2 text-left font-medium text-foreground">Имя</th>
                <th className="p-2 text-center font-medium text-foreground">Email</th>
                <th className="p-2 text-center font-medium text-foreground">Stripchat</th>
                <th className="p-2 text-center font-medium text-foreground">Chaturbate</th>
                <th className="p-2 text-center font-medium text-foreground">CamSoda</th>
                <th className="p-2 text-center font-medium text-foreground">Процент %</th>
                <th className="p-2 text-center font-medium text-foreground">Аванс (₽)</th>
                <th className="p-2 text-center font-medium text-foreground">Штраф (₽)</th>
                <th className="p-2 text-right font-medium text-foreground">ЗП ($)</th>
                <th className="p-2 text-right font-medium text-foreground">ЗП (₽)</th>
                <th className="p-2 text-center font-medium text-foreground"></th>
              </tr>
            </thead>
            <tbody>
              {soloModels.map((model) => {
                const { dollars, rubles } = calculateSoloSalary(model);
                
                return (
                  <tr key={model.id} className="border-b border-border hover:bg-muted/30">
                    <td className="p-2">
                      <Input
                        type="text"
                        value={model.name}
                        onChange={(e) => onSoloInputChange(model.id, 'name', e.target.value)}
                        placeholder="Имя модели"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="email"
                        value={model.email}
                        onChange={(e) => onSoloInputChange(model.id, 'email', e.target.value)}
                        placeholder="email@example.com"
                        className="text-center"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="text"
                        value={model.stripchat}
                        onChange={(e) => onSoloInputChange(model.id, 'stripchat', e.target.value)}
                        className="text-center"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="text"
                        value={model.chaturbate}
                        onChange={(e) => onSoloInputChange(model.id, 'chaturbate', e.target.value)}
                        className="text-center"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="text"
                        value={model.camsoda}
                        onChange={(e) => onSoloInputChange(model.id, 'camsoda', e.target.value)}
                        className="text-center"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="text"
                        value={model.percentage}
                        onChange={(e) => onSoloInputChange(model.id, 'percentage', e.target.value)}
                        className="text-center"
                        placeholder="50"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="text"
                        value={model.advance}
                        onChange={(e) => onSoloInputChange(model.id, 'advance', e.target.value)}
                        className="text-center"
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="text"
                        value={model.penalty}
                        onChange={(e) => onSoloInputChange(model.id, 'penalty', e.target.value)}
                        className="text-center"
                      />
                    </td>
                    <td className="p-2 text-right font-semibold">${dollars.toFixed(2)}</td>
                    <td className="p-2 text-right font-semibold">{rubles.toFixed(2)} ₽</td>
                    <td className="p-2 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveModel(model.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Icon name="Trash2" size={16} />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

export default SoloMakerCalculation;
