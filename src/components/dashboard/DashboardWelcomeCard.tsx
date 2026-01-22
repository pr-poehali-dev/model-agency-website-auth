import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';

interface DashboardWelcomeCardProps {
  userFullName: string;
  userRole: string;
}

const roleNames: Record<string, string> = {
  'director': 'Директор',
  'producer': 'Продюсер',
  'operator': 'Оператор',
  'content_maker': 'Контент-мейкер',
  'solo_maker': 'Соло-мейкер',
  'model': 'Модель'
};

const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Доброе утро';
  if (hour < 18) return 'Добрый день';
  return 'Добрый вечер';
};

const DashboardWelcomeCard = ({ userFullName, userRole }: DashboardWelcomeCardProps) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl p-8 border border-primary/20">
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-primary/20 rounded-full">
            <Icon name="Sparkles" size={28} className="text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{getTimeGreeting()},</p>
            <h1 className="text-3xl font-serif font-bold text-foreground">{userFullName}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <Badge variant="secondary" className="bg-primary/20 text-primary px-3 py-1">
            <Icon name="Briefcase" size={14} className="mr-1" />
            {roleNames[userRole] || userRole}
          </Badge>
        </div>
      </div>
      <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute -left-4 -top-4 w-32 h-32 bg-primary/5 rounded-full blur-2xl" />
    </div>
  );
};

export default DashboardWelcomeCard;
