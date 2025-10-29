import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface Model {
  id: number;
  name: string;
  image: string;
  height: string;
  bust: string;
  waist: string;
  hips: string;
  experience: string;
  specialty: string;
  status: string;
}

interface ModelsTabProps {
  models: Model[];
  operatorAssignments?: number[];
  producerAssignments?: number[];
  assignedProducer?: string;
  onViewFinances?: (modelId: number, modelName: string) => void;
}

const ModelsTab = ({ 
  models, 
  operatorAssignments = [], 
  producerAssignments = [],
  assignedProducer = '',
  onViewFinances 
}: ModelsTabProps) => {
  const displayModels = operatorAssignments.length > 0 
    ? models.filter(m => operatorAssignments.includes(m.id))
    : producerAssignments.length > 0
    ? models.filter(m => producerAssignments.includes(m.id))
    : models;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-serif font-bold text-foreground mb-2">Наши модели</h2>
          <p className="text-muted-foreground">Управление портфолио талантов</p>
          {operatorAssignments.length > 0 && (
            <Badge variant="secondary" className="mt-2">
              Назначено вам: {operatorAssignments.length} {operatorAssignments.length === 1 ? 'модель' : 'моделей'}
            </Badge>
          )}
          {producerAssignments.length > 0 && (
            <Badge variant="secondary" className="mt-2">
              Назначено вам: {producerAssignments.length} {producerAssignments.length === 1 ? 'модель' : 'моделей'}
            </Badge>
          )}
          {assignedProducer && (
            <div className="mt-2">
              <Badge variant="outline">Ваш продюсер: {assignedProducer}</Badge>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {displayModels.map((model) => (
          <Card key={model.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 group">
            <div className="relative h-64 overflow-hidden">
              <img 
                src={model.image} 
                alt={model.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute top-3 right-3">
                <Badge variant={model.status === 'Available' ? 'default' : 'secondary'}>
                  {model.status === 'Available' ? 'Доступна' : 'Занята'}
                </Badge>
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-serif font-bold mb-2">{model.name}</h3>
              <p className="text-sm text-accent font-medium mb-4">{model.specialty}</p>
              
              <div className="space-y-2 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-2">
                  <Icon name="Ruler" size={16} />
                  <span>Рост: {model.height}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="Award" size={16} />
                  <span>Опыт: {model.experience}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 p-3 bg-muted/50 rounded-lg mb-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Грудь</p>
                  <p className="text-sm font-semibold">{model.bust}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Талия</p>
                  <p className="text-sm font-semibold">{model.waist}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Бедра</p>
                  <p className="text-sm font-semibold">{model.hips}</p>
                </div>
              </div>

              {onViewFinances && (
                <Button 
                  variant="outline" 
                  className="w-full gap-2"
                  onClick={() => onViewFinances(model.id, model.name)}
                >
                  <Icon name="DollarSign" size={16} />
                  Финансы модели
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ModelsTab;
