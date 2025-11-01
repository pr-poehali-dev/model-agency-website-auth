import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { type UserRole } from '@/lib/permissions';
import PhotoUpload from '@/components/PhotoUpload';

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

interface EditUserDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUser: User | null;
  editPassword: string;
  setEditPassword: (password: string) => void;
  editFullName: string;
  setEditFullName: (name: string) => void;
  editRole: UserRole;
  setEditRole: (role: UserRole) => void;
  editIsActive: boolean;
  setEditIsActive: (active: boolean) => void;
  onSubmit: () => void;
  loading: boolean;
}

const EditUserDialog = ({
  isOpen,
  onOpenChange,
  selectedUser,
  editPassword,
  setEditPassword,
  editFullName,
  setEditFullName,
  editRole,
  setEditRole,
  editIsActive,
  setEditIsActive,
  onSubmit,
  loading,
}: EditUserDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground font-serif">Редактировать пользователя</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {selectedUser?.email}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {selectedUser && (
            <PhotoUpload
              currentPhotoUrl={selectedUser.photoUrl}
              onPhotoUploaded={() => {}}
              userId={selectedUser.id}
            />
          )}
          <div className="space-y-2">
            <Label htmlFor="editFullName">Полное имя</Label>
            <Input
              id="editFullName"
              value={editFullName}
              onChange={(e) => setEditFullName(e.target.value)}
              className="bg-input border-border"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="editPassword">Новый пароль (оставьте пустым, чтобы не менять)</Label>
            <Input
              id="editPassword"
              type="password"
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              placeholder="Введите новый пароль"
              className="bg-input border-border"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="editRole">Роль</Label>
            <Select value={editRole} onValueChange={(value) => setEditRole(value as UserRole)}>
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
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="editIsActive"
              checked={editIsActive}
              onChange={(e) => setEditIsActive(e.target.checked)}
              className="w-4 h-4"
            />
            <Label htmlFor="editIsActive" className="cursor-pointer">
              Активный аккаунт
            </Label>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={onSubmit} disabled={loading} className="bg-primary hover:bg-primary/90">
            {loading ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;