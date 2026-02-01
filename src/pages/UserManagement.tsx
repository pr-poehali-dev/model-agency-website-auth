import { useState } from 'react';
import Icon from '@/components/ui/icon';
import UserCard from '@/components/UserManagement/UserCard';
import UserManagementHeader from './user-management-components/UserManagementHeader';
import UserManagementDialogs from './user-management-components/UserManagementDialogs';
import { useUserManagement } from './user-management-components/useUserManagement';

const UserManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const {
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
  } = useUserManagement();

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
      <UserManagementHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onAddUser={() => setIsAddDialogOpen(true)}
        onCleanup={handleCleanupOrphanedAssignments}
        loading={loading}
        currentUserRole={currentUserRole}
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

      <UserManagementDialogs
        isAddDialogOpen={isAddDialogOpen}
        setIsAddDialogOpen={setIsAddDialogOpen}
        newUserEmail={newUserEmail}
        setNewUserEmail={setNewUserEmail}
        newUserPassword={newUserPassword}
        setNewUserPassword={setNewUserPassword}
        newUserFullName={newUserFullName}
        setNewUserFullName={setNewUserFullName}
        newUserRole={newUserRole}
        setNewUserRole={setNewUserRole}
        onAddSubmit={handleAddUser}
        
        isEditDialogOpen={isEditDialogOpen}
        setIsEditDialogOpen={setIsEditDialogOpen}
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
        onEditSubmit={handleEditUser}
        
        isPermissionsDialogOpen={isPermissionsDialogOpen}
        setIsPermissionsDialogOpen={setIsPermissionsDialogOpen}
        userPermissions={userPermissions}
        onPermissionToggle={handlePermissionToggle}
        onPermissionsSubmit={handleSavePermissions}
        
        loading={loading}
        currentUserRole={currentUserRole}
      />
    </div>
  );
};

export default UserManagement;
