import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

interface DashboardHomeProps {
  models: Model[];
}

const DashboardHome = ({ models }: DashboardHomeProps) => {
  const activeModels = models.filter(m => m.status === 'Available').length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-serif font-bold text-foreground mb-2">Главная</h2>
        <p className="text-muted-foreground">Обзор моделей агентства</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-gradient-to-br from-accent/10 to-primary/10 border-accent/20">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-accent/20 rounded-lg">
              <Icon name="Users" size={24} className="text-accent" />
            </div>
            <Badge variant="secondary" className="bg-accent/20 text-accent">{activeModels} активных</Badge>
          </div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Всего моделей</h3>
          <p className="text-3xl font-serif font-bold text-foreground">{models.length}</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-primary/20 rounded-lg">
              <Icon name="CheckCircle" size={24} className="text-primary" />
            </div>
            <Badge variant="secondary" className="bg-primary/20 text-primary">Доступны</Badge>
          </div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Активные модели</h3>
          <p className="text-3xl font-serif font-bold text-foreground">{activeModels}</p>
        </Card>
      </div>
    </div>
  );
};

export default DashboardHome;