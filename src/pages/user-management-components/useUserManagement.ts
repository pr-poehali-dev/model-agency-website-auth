import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { addAuditLog } from '@/lib/auditLog';
import { getAuthHeaders, authenticatedFetch, authenticatedFetchNoCreds } from '@/lib/api';
import { ROLE_PERMISSIONS, type UserRole } from '@/lib/permissions';

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

export const useUserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  
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
      const response = await authenticatedFetch(API_URL, { method: 'GET', headers: getAuthHeaders(), credentials: 'include' });
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
      const response = await authenticatedFetch(API_URL, { method: 'GET', headers: getAuthHeaders(), credentials: 'include' });
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
      
      const response = await authenticatedFetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
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

      if (editRole === 'solo_maker') {
        updateData.soloPercentage = editSoloPercentage;
      } else if (selectedUser.role === 'solo_maker' && editRole !== 'solo_maker') {
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

      const response = await authenticatedFetch(API_URL, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': currentUserEmail,
          ...getAuthHeaders()
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

    if (!confirm(`Удалить пользователя ${email}?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await authenticatedFetchNoCreds(`${API_URL}?id=${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
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
      const response = await authenticatedFetch(CLEANUP_API_URL, {
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
      const response = await authenticatedFetch(API_URL, {
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

  return {
    users,
    loading,
    initialLoading,
    currentUserRole,
    selectedUser,
    
    isAddDialogOpen,
    setIsAddDialogOpen,
    isEditDialogOpen,
    setIsEditDialogOpen,
    isPermissionsDialogOpen,
    setIsPermissionsDialogOpen,
    
    newUserEmail,
    setNewUserEmail,
    newUserPassword,
    setNewUserPassword,
    newUserFullName,
    setNewUserFullName,
    newUserRole,
    setNewUserRole,
    
    editPassword,
    setEditPassword,
    editFullName,
    setEditFullName,
    editRole,
    setEditRole,
    editIsActive,
    setEditIsActive,
    editPhotoUrl,
    setEditPhotoUrl,
    editSoloPercentage,
    setEditSoloPercentage,
    
    userPermissions,
    
    handleAddUser,
    handleEditUser,
    handleDeleteUser,
    openEditDialog,
    openPermissionsDialog,
    handlePermissionToggle,
    handleCleanupOrphanedAssignments,
    handleSavePermissions,
  };
};