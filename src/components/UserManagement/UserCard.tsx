import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ROLE_LABELS, type UserRole } from '@/lib/permissions';

interface User {
  id: number;
  email: string;
  role: UserRole;
  fullName: string;
  isActive: boolean;
  permissions: string[];
  createdAt?: string;
  photoUrl?: string;
}

interface UserCardProps {
  user: User;
  onOpenPermissions: (user: User) => void;
  onOpenEdit: (user: User) => void;
  onDelete: (userId: number, email: string) => void;
}

const UserCard = ({ user, onOpenPermissions, onOpenEdit, onDelete }: UserCardProps) => {
  return (
    <Card className="p-6 bg-card border-border hover:border-primary/50 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
            {user.photoUrl ? (
              <img src={user.photoUrl} alt={user.fullName} className="w-full h-full object-cover" />
            ) : (
              <Icon name="User" size={24} className="text-primary" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">{user.fullName}</h3>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-primary/20 text-primary hover:bg-primary/30">
                {ROLE_LABELS[user.role]}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {user.permissions?.length || 0} прав доступа
              </span>
              {!user.isActive && (
                <Badge variant="destructive">Деактивирован</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user.role !== 'director' ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenPermissions(user)}
                className="border-border hover:border-primary"
              >
                <Icon name="Shield" size={16} className="mr-2" />
                Права доступа
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenEdit(user)}
                className="border-border hover:border-primary"
              >
                <Icon name="Settings" size={16} className="mr-2" />
                Настроить
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(user.id, user.email)}
                className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <Icon name="Trash2" size={16} />
              </Button>
            </>
          ) : (
            <Badge variant="secondary" className="text-xs px-4 py-2">
              <Icon name="Lock" size={14} className="mr-2" />
              Защищенная учетная запись
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
};

export default UserCard;