import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  PERMISSION_LABELS,
  ROLE_LABELS,
  ROLE_PERMISSIONS,
  type UserRole,
} from '@/lib/permissions';

interface User {
  id: number;
  email: string;
  role: UserRole;
  fullName: string;
  isActive: boolean;
  permissions: string[];
  createdAt?: string;
}

interface PermissionsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUser: User | null;
  userPermissions: string[];
  onPermissionToggle: (permission: string) => void;
  onSubmit: () => void;
  loading: boolean;
  currentUserRole: UserRole | null;
}

const PermissionsDialog = ({
  isOpen,
  onOpenChange,
  selectedUser,
  userPermissions,
  onPermissionToggle,
  onSubmit,
  loading,
  currentUserRole,
}: PermissionsDialogProps) => {
  const isDirector = currentUserRole === 'director';
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-foreground font-serif">Настройка прав доступа</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {selectedUser?.email} • {selectedUser && ROLE_LABELS[selectedUser.role]}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-4">
            <div className="mb-4 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Выберите права доступа для пользователя. Базовые права определяются ролью, но вы можете настроить их индивидуально.
              </p>
            </div>
            <div className="grid gap-3">
              {Object.entries(PERMISSION_LABELS).map(([key, label]) => {
                const isManageUsers = key === 'manage_users';
                const isDisabled = isManageUsers && !isDirector;
                
                return (
                  <div
                    key={key}
                    className={`flex items-center space-x-3 p-3 rounded-lg border border-border transition-colors ${
                      isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-accent/50'
                    }`}
                  >
                    <Checkbox
                      id={key}
                      checked={userPermissions?.includes(key) || false}
                      onCheckedChange={() => !isDisabled && onPermissionToggle(key)}
                      disabled={isDisabled}
                      className="border-border"
                    />
                  <Label
                    htmlFor={key}
                    className="flex-1 cursor-pointer text-foreground font-medium"
                  >
                    {label}
                  </Label>
                  {selectedUser && ROLE_PERMISSIONS[selectedUser.role]?.includes(key) && (
                    <Badge variant="secondary" className="text-xs">
                      По умолчанию для роли
                    </Badge>
                  )}
                  {isDisabled && (
                    <Badge variant="outline" className="text-xs border-orange-500 text-orange-500">
                      Только для директора
                    </Badge>
                  )}
                </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={onSubmit} disabled={loading} className="bg-primary hover:bg-primary/90">
            {loading ? 'Сохранение...' : 'Сохранить изменения'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PermissionsDialog;