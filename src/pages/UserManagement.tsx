import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { addAuditLog } from '@/lib/auditLog';
import {
  ROLE_PERMISSIONS,
  type UserRole,
} from '@/lib/permissions';
import Icon from '@/components/ui/icon';
import UserCard from '@/components/UserManagement/UserCard';
import AddUserDialog from '@/components/UserManagement/AddUserDialog';
import EditUserDialog from '@/components/UserManagement/EditUserDialog';
import PermissionsDialog from '@/components/UserManagement/PermissionsDialog';

const API_URL = 'https://functions.poehali.dev/67fd6902-6170-487e-bb46-f6d14ec99066';
const CLEANUP_API_URL = 'https://functions.poehali.dev/ebdade58-dd83-497b-bd3b-570e724eed8b';

interface User {
  id: number;
  email: string;
  role: UserRole;
  fullName: string;
  isActive: boolean;
  permissions: string[];
  createdAt?: string;
  photoUrl?: string;
  soloPercentage?: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
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
  const [editPhotoUrl, setEditPhotoUrl] = useState('');
  const [editSoloPercentage, setEditSoloPercentage] = useState('50');
  
  const [userPermissions, setUserPermissions] = useState<string[]>([]);

  const { toast } = useToast();

  useEffect(() => {
    const init = async () => {
      await Promise.all([loadUsers(), loadCurrentUser()]);
      setInitialLoading(false);
    };
    init();
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
      const defaultPermissions = [...ROLE_PERMISSIONS[newUserRole]];
      
      if (newUserRole === 'producer') {
        defaultPermissions.push('view_checks');
      } else if (newUserRole === 'content_maker') {
        defaultPermissions.push('view_schedule');
      }
      
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

      if (editPhotoUrl !== selectedUser.photoUrl) {
        updateData.photoUrl = editPhotoUrl;
      }

      // Always update solo percentage if role is solo_maker (even if it was already solo_maker)
      if (editRole === 'solo_maker') {
        updateData.soloPercentage = editSoloPercentage;
      } else if (selectedUser.role === 'solo_maker' && editRole !== 'solo_maker') {
        // If changing FROM solo_maker to another role, remove the percentage
        updateData.soloPercentage = null;
      }

      if (editRole !== selectedUser.role) {
        const defaultPermissions = [...ROLE_PERMISSIONS[editRole]];
        
        if (editRole === 'producer') {
          defaultPermissions.push('view_checks');
        } else if (editRole === 'content_maker') {
          defaultPermissions.push('view_schedule');
        }
        
        updateData.permissions = defaultPermissions;
      }

      const response = await fetch(API_URL, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': currentUserEmail,
        },
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
    setEditPhotoUrl(user.photoUrl || '');
    setEditSoloPercentage(user.soloPercentage || '50');
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

  const handleCleanupOrphanedAssignments = async () => {
    const currentUserEmail = localStorage.getItem('userEmail') || '';
    setLoading(true);
    
    try {
      const response = await fetch(CLEANUP_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Role': currentUserRole || 'director'
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Ошибка очистки');
      }
      
      const result = await response.json();
      
      toast({
        title: 'Очистка завершена',
        description: result.message,
      });
      
      await loadUsers();
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

  const filteredUsers = users.filter(u => 
    u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Icon name="Loader2" size={48} className="animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Загрузка пользователей...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-4xl font-serif font-bold text-foreground mb-2">Управление пользователями</h2>
          <p className="text-muted-foreground">Создавайте учетные записи и управляйте правами доступа</p>
        </div>
        
        <div className="flex items-center gap-2">
          {currentUserRole === 'director' && (
            <button
              onClick={handleCleanupOrphanedAssignments}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg border border-destructive/20 transition-colors disabled:opacity-50"
              title="Удалить назначения удалённых пользователей"
            >
              Очистить базу
            </button>
          )}
          <button
            onClick={() => setIsAddDialogOpen(true)}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            Добавить пользователя
          </button>
          <div className="relative flex-1 lg:w-64">
            <input
              type="text"
              placeholder="Поиск пользователей..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
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

      <div className="grid gap-4">
        {filteredUsers.map((user) => (
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
        editPhotoUrl={editPhotoUrl}
        setEditPhotoUrl={setEditPhotoUrl}
        editSoloPercentage={editSoloPercentage}
        setEditSoloPercentage={setEditSoloPercentage}
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