import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { addAuditLog } from '@/lib/auditLog';
import {
  ROLE_PERMISSIONS,
  type UserRole,
} from '@/lib/permissions';
import UserCard from '@/components/UserManagement/UserCard';
import AddUserDialog from '@/components/UserManagement/AddUserDialog';
import EditUserDialog from '@/components/UserManagement/EditUserDialog';
import PermissionsDialog from '@/components/UserManagement/PermissionsDialog';

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
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);
  
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
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    const email = localStorage.getItem('userEmail') || '';
    try {
      const response = await fetch(API_URL, { method: 'GET' });
      const allUsers = await response.json();
      const current = allUsers.find((u: User) => u.email === email);
      if (current) {
        setCurrentUserRole(current.role);
      }
    } catch (err) {
      console.error('Failed to load current user', err);
    }
  };

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
    const defaultPerms = ROLE_PERMISSIONS[user.role] || [];
    setUserPermissions(user.permissions || defaultPerms);
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
        headers: { 
          'Content-Type': 'application/json',
          'X-User-Email': currentUserEmail
        },
        body: JSON.stringify({
          id: selectedUser.id,
          permissions: userPermissions,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Ошибка обновления прав доступа');
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
        
        <AddUserDialog
          isOpen={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          newUserEmail={newUserEmail}
          setNewUserEmail={setNewUserEmail}
          newUserPassword={newUserPassword}
          setNewUserPassword={setNewUserPassword}
          newUserFullName={newUserFullName}
          setNewUserFullName={setNewUserFullName}
          newUserRole={newUserRole}
          setNewUserRole={setNewUserRole}
          onSubmit={handleAddUser}
          loading={loading}
        />
      </div>

      <div className="grid gap-4">
        {users.map((user) => (
          <UserCard
            key={user.id}
            user={user}
            onOpenPermissions={openPermissionsDialog}
            onOpenEdit={openEditDialog}
            onDelete={handleDeleteUser}
          />
        ))}
      </div>

      <EditUserDialog
        isOpen={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        selectedUser={selectedUser}
        editPassword={editPassword}
        setEditPassword={setEditPassword}
        editFullName={editFullName}
        setEditFullName={setEditFullName}
        editRole={editRole}
        setEditRole={setEditRole}
        editIsActive={editIsActive}
        setEditIsActive={setEditIsActive}
        onSubmit={handleEditUser}
        loading={loading}
      />

      <PermissionsDialog
        isOpen={isPermissionsDialogOpen}
        onOpenChange={setIsPermissionsDialogOpen}
        selectedUser={selectedUser}
        userPermissions={userPermissions}
        onPermissionToggle={handlePermissionToggle}
        onSubmit={handleSavePermissions}
        loading={loading}
        currentUserRole={currentUserRole}
      />
    </div>
  );
};

export default UserManagement;