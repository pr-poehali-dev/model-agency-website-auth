import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

const ChecksTab = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-serif font-bold text-foreground mb-2">Чеки</h2>
        <p className="text-muted-foreground">Управление финансовыми документами</p>
      </div>

      <Card className="p-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="p-6 bg-muted rounded-full">
            <Icon name="Receipt" size={48} className="text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold">Раздел в разработке</h3>
          <p className="text-muted-foreground max-w-md">
            Здесь будет система управления чеками и финансовыми документами
          </p>
        </div>
      </Card>
    </div>
  );
};

export default ChecksTab;
