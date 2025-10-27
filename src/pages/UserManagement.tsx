import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  getAllUsers,
  updateUserRole,
  updateUserPermissions,
  addUser,
  deleteUser,
  PERMISSIONS,
  PERMISSION_LABELS,
  ROLE_LABELS,
  ROLE_PERMISSIONS,
  type User,
  type UserRole,
} from '@/lib/permissions';
import { useToast } from '@/hooks/use-toast';
import { addAuditLog } from '@/lib/auditLog';

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('content_maker');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    setUsers(getAllUsers());
  };

  const handleAddUser = () => {
    const currentUserEmail = localStorage.getItem('userEmail') || '';
    if (!newUserEmail.includes('@')) {
      toast({
        title: 'Ошибка',
        description: 'Введите корректный email',
        variant: 'destructive',
      });
      return;
    }

    addUser(newUserEmail, newUserRole);
    addAuditLog(
      currentUserEmail,
      'Добавление пользователя',
      `Добавлен пользователь ${newUserEmail} с ролью ${newUserRole}`,
      'users'
    );
    loadUsers();
    setNewUserEmail('');
    setNewUserRole('content_maker');
    setIsAddDialogOpen(false);
    toast({
      title: 'Успешно',
      description: 'Пользователь добавлен',
    });
  };

  const handleDeleteUser = (email: string) => {
    const currentUserEmail = localStorage.getItem('userEmail') || '';
    if (email === currentUserEmail) {
      toast({
        title: 'Ошибка',
        description: 'Нельзя удалить самого себя',
        variant: 'destructive',
      });
      return;
    }

    deleteUser(email);
    addAuditLog(
      currentUserEmail,
      'Удаление пользователя',
      `Удален пользователь ${email}`,
      'users'
    );
    loadUsers();
    toast({
      title: 'Успешно',
      description: 'Пользователь удален',
    });
  };

  const handleRoleChange = (email: string, newRole: UserRole) => {
    const currentUserEmail = localStorage.getItem('userEmail') || '';
    updateUserRole(email, newRole);
    addAuditLog(
      currentUserEmail,
      'Изменение роли',
      `Роль пользователя ${email} изменена на ${newRole}`,
      'users'
    );
    loadUsers();
    toast({
      title: 'Успешно',
      description: 'Роль изменена',
    });
  };

  const handlePermissionToggle = (permission: string) => {
    if (!selectedUser) return;

    const currentPermissions = selectedUser.permissions;
    const newPermissions = currentPermissions.includes(permission)
      ? currentPermissions.filter(p => p !== permission)
      : [...currentPermissions, permission];

    updateUserPermissions(selectedUser.email, newPermissions);
    setSelectedUser({ ...selectedUser, permissions: newPermissions });
    loadUsers();
  };

  const handleSavePermissions = () => {
    const currentUserEmail = localStorage.getItem('userEmail') || '';
    if (selectedUser) {
      addAuditLog(
        currentUserEmail,
        'Изменение прав',
        `Обновлены права доступа для ${selectedUser.email}`,
        'users'
      );
    }
    setIsEditDialogOpen(false);
    toast({
      title: 'Успешно',
      description: 'Права доступа обновлены',
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-4xl font-serif font-bold text-foreground mb-2">Управление пользователями</h2>
          <p className="text-muted-foreground">Настройте роли и права доступа</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
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
                Добавьте нового пользователя в систему
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
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
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Отмена
              </Button>
              <Button onClick={handleAddUser} className="bg-primary hover:bg-primary/90">
                Добавить
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.email} className="p-6 bg-card border-border hover:border-primary/50 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon name="User" size={24} className="text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">{user.email}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="bg-primary/20 text-primary hover:bg-primary/30">
                      {ROLE_LABELS[user.role]}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {user.permissions.length} прав доступа
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Select
                  value={user.role}
                  onValueChange={(value) => handleRoleChange(user.email, value as UserRole)}
                >
                  <SelectTrigger className="w-[200px] bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="director">Директор</SelectItem>
                    <SelectItem value="producer">Продюссер</SelectItem>
                    <SelectItem value="operator">Оператор</SelectItem>
                    <SelectItem value="content_maker">Контент-мейкер</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedUser(user);
                    setIsEditDialogOpen(true);
                  }}
                  className="border-border hover:border-primary"
                >
                  <Icon name="Settings" size={16} className="mr-2" />
                  Настроить права
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteUser(user.email)}
                  className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Icon name="Trash2" size={16} />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
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
                {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
                  <div
                    key={key}
                    className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                  >
                    <Checkbox
                      id={key}
                      checked={selectedUser?.permissions.includes(key) || false}
                      onCheckedChange={() => handlePermissionToggle(key)}
                      className="border-border"
                    />
                    <Label
                      htmlFor={key}
                      className="flex-1 cursor-pointer text-foreground font-medium"
                    >
                      {label}
                    </Label>
                    {selectedUser && ROLE_PERMISSIONS[selectedUser.role].includes(key) && (
                      <Badge variant="secondary" className="text-xs">
                        По умолчанию для роли
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSavePermissions} className="bg-primary hover:bg-primary/90">
              Сохранить изменения
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
