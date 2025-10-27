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
import { useToast } from '@/hooks/use-toast';
import { addAuditLog } from '@/lib/auditLog';
import {
  PERMISSIONS,
  PERMISSION_LABELS,
  ROLE_LABELS,
  ROLE_PERMISSIONS,
  type UserRole,
} from '@/lib/permissions';

const API_URL = 'https://functions.poehali.dev/67fd6902-6170-487e-bb46-f6d14ec99066';

interface User {
  id: number;
  email: string;
  role: UserRole;
  fullName: string;
  isActive: boolean;
  permissions: string[];
  createdAt?: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserFullName, setNewUserFullName] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('content_maker');
  
  const [editPassword, setEditPassword] = useState('');
  const [editFullName, setEditFullName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('content_maker');
  const [editIsActive, setEditIsActive] = useState(true);
  
  const [userPermissions, setUserPermissions] = useState<string[]>([]);

  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await fetch(API_URL, { method: 'GET' });
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить пользователей',
        variant: 'destructive',
      });
    }
  };

  const handleAddUser = async () => {
    const currentUserEmail = localStorage.getItem('userEmail') || '';
    
    if (!newUserEmail.includes('@') || !newUserPassword || !newUserFullName) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все поля',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const defaultPermissions = ROLE_PERMISSIONS[newUserRole];
      
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_user',
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
          fullName: newUserFullName,
          permissions: defaultPermissions,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Ошибка создания пользователя');
      }

      addAuditLog(
        currentUserEmail,
        'Добавление пользователя',
        `Добавлен пользователь ${newUserEmail} с ролью ${newUserRole}`,
        'users'
      );
      
      await loadUsers();
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserFullName('');
      setNewUserRole('content_maker');
      setIsAddDialogOpen(false);
      
      toast({
        title: 'Успешно',
        description: 'Пользователь добавлен',
      });
    } catch (err: any) {
      toast({
        title: 'Ошибка',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;
    
    const currentUserEmail = localStorage.getItem('userEmail') || '';
    setLoading(true);

    try {
      const updateData: any = {
        id: selectedUser.id,
        role: editRole,
        fullName: editFullName,
        isActive: editIsActive,
      };

      if (editPassword) {
        updateData.password = editPassword;
      }

      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Ошибка обновления пользователя');
      }

      addAuditLog(
        currentUserEmail,
        'Изменение данных пользователя',
        `Обновлены данные для ${selectedUser.email}`,
        'users'
      );

      await loadUsers();
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      setEditPassword('');
      
      toast({
        title: 'Успешно',
        description: 'Данные обновлены',
      });
    } catch (err: any) {
      toast({
        title: 'Ошибка',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number, email: string) => {
    const currentUserEmail = localStorage.getItem('userEmail') || '';
    
    if (email === currentUserEmail) {
      toast({
        title: 'Ошибка',
        description: 'Нельзя удалить самого себя',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm(`Удалить пользователя ${email}?`)) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}?id=${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Ошибка удаления пользователя');
      }

      addAuditLog(
        currentUserEmail,
        'Удаление пользователя',
        `Удален пользователь ${email}`,
        'users'
      );

      await loadUsers();
      toast({
        title: 'Успешно',
        description: 'Пользователь удален',
      });
    } catch (err: any) {
      toast({
        title: 'Ошибка',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setEditFullName(user.fullName);
    setEditRole(user.role);
    setEditIsActive(user.isActive);
    setEditPassword('');
    setIsEditDialogOpen(true);
  };

  const openPermissionsDialog = (user: User) => {
    setSelectedUser(user);
    setUserPermissions(user.permissions || ROLE_PERMISSIONS[user.role]);
    setIsPermissionsDialogOpen(true);
  };

  const handlePermissionToggle = (permission: string) => {
    setUserPermissions(prev => 
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    );
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;

    const currentUserEmail = localStorage.getItem('userEmail') || '';
    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedUser.id,
          permissions: userPermissions,
        }),
      });

      if (!response.ok) {
        throw new Error('Ошибка обновления прав доступа');
      }

      addAuditLog(
        currentUserEmail,
        'Изменение прав доступа',
        `Обновлены права доступа для ${selectedUser.email}`,
        'users'
      );

      await loadUsers();
      setIsPermissionsDialogOpen(false);
      setSelectedUser(null);
      
      toast({
        title: 'Успешно',
        description: 'Права доступа обновлены',
      });
    } catch (err: any) {
      toast({
        title: 'Ошибка',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-4xl font-serif font-bold text-foreground mb-2">Управление пользователями</h2>
          <p className="text-muted-foreground">Создавайте учетные записи и управляйте правами доступа</p>
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
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Отмена
              </Button>
              <Button onClick={handleAddUser} disabled={loading} className="bg-primary hover:bg-primary/90">
                {loading ? 'Создание...' : 'Создать'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id} className="p-6 bg-card border-border hover:border-primary/50 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon name="User" size={24} className="text-primary" />
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openPermissionsDialog(user)}
                  className="border-border hover:border-primary"
                >
                  <Icon name="Shield" size={16} className="mr-2" />
                  Права доступа
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(user)}
                  className="border-border hover:border-primary"
                >
                  <Icon name="Settings" size={16} className="mr-2" />
                  Настроить
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteUser(user.id, user.email)}
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
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground font-serif">Редактировать пользователя</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleEditUser} disabled={loading} className="bg-primary hover:bg-primary/90">
              {loading ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
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
                      checked={userPermissions.includes(key)}
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
            <Button variant="outline" onClick={() => setIsPermissionsDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSavePermissions} disabled={loading} className="bg-primary hover:bg-primary/90">
              {loading ? 'Сохранение...' : 'Сохранить изменения'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
