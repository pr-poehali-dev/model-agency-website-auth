import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import type { UserRole } from '@/lib/permissions';

interface ProductionTabProps {
  userRole?: UserRole;
  userEmail?: string;
}

const ProductionTab = ({ userRole }: ProductionTabProps) => {
  const isDirector = userRole === 'director';

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">Продакшн</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isDirector
              ? 'Управление производством контента'
              : 'Производство контента по твоим сотрудникам'}
          </p>
        </div>
      </div>

      <Card className="border-border/50 bg-secondary/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground font-heading">
            <Icon name="Clapperboard" size={20} className="text-primary" />
            Раздел в работе
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="rounded-full bg-primary/10 border border-primary/20 p-5 mb-4">
              <Icon name="Clapperboard" size={36} className="text-primary" />
            </div>
            <p className="text-foreground font-medium mb-1">Здесь скоро появится продакшн</p>
            <p className="text-sm text-muted-foreground max-w-md">
              Раздел создан и доступен директору и продюсерам. Расскажи, что нужно внутри —
              съёмки, контент-план, оборудование — и я всё соберу.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductionTab;
