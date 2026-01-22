import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface DashboardProducerCardProps {
  producerName: string;
}

const DashboardProducerCard = ({ producerName }: DashboardProducerCardProps) => {
  if (!producerName) {
    return null;
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-purple-500/20">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 bg-purple-500/10 rounded-lg">
          <Icon name="UserCheck" size={24} className="text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Мой продюсер</h2>
          <p className="text-sm text-muted-foreground">Ваш куратор</p>
        </div>
      </div>
      
      <div className="mt-4">
        <p className="text-2xl font-serif font-bold text-foreground">{producerName}</p>
      </div>
    </Card>
  );
};

export default DashboardProducerCard;
