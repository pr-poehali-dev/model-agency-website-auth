import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { type UserRole } from '@/lib/permissions';

interface AddUserDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  newUserEmail: string;
  setNewUserEmail: (email: string) => void;
  newUserPassword: string;
  setNewUserPassword: (password: string) => void;
  newUserFullName: string;
  setNewUserFullName: (name: string) => void;
  newUserRole: UserRole;
  setNewUserRole: (role: UserRole) => void;
  onSubmit: () => void;
  loading: boolean;
}

const AddUserDialog = ({
  isOpen,
  onOpenChange,
  newUserEmail,
  setNewUserEmail,
  newUserPassword,
  setNewUserPassword,
  newUserFullName,
  setNewUserFullName,
  newUserRole,
  setNewUserRole,
  onSubmit,
  loading,
}: AddUserDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
          <Icon name="UserPlus" size={18} className="mr-2" />
          Добавить пользователя
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground font-serif">Новый пользователь</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Создайте учетную запись с логином и паролем
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Полное имя</Label>
            <Input
              id="fullName"
              value={newUserFullName}
              onChange={(e) => setNewUserFullName(e.target.value)}
              placeholder="Иван Иванов"
              className="bg-input border-border"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email (логин)</Label>
            <Input
              id="email"
              type="email"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              placeholder="user@mba-corp.com"
              className="bg-input border-border"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              type="password"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              placeholder="Минимум 6 символов"
              className="bg-input border-border"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Роль</Label>
            <Select value={newUserRole} onValueChange={(value) => setNewUserRole(value as UserRole)}>
              <SelectTrigger className="bg-input border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                <SelectItem value="director">Директор</SelectItem>
                <SelectItem value="producer">Продюссер</SelectItem>
                <SelectItem value="operator">Оператор</SelectItem>
                <SelectItem value="content_maker">Контент-мейкер</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={onSubmit} disabled={loading} className="bg-primary hover:bg-primary/90">
            {loading ? 'Создание...' : 'Создать'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserDialog;
