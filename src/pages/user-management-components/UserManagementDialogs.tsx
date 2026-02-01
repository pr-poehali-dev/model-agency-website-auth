import AddUserDialog from '@/components/UserManagement/AddUserDialog';
import EditUserDialog from '@/components/UserManagement/EditUserDialog';
import PermissionsDialog from '@/components/UserManagement/PermissionsDialog';
import { UserRole } from '@/lib/permissions';

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

interface UserManagementDialogsProps {
  isAddDialogOpen: boolean;
  setIsAddDialogOpen: (open: boolean) => void;
  newUserEmail: string;
  setNewUserEmail: (value: string) => void;
  newUserPassword: string;
  setNewUserPassword: (value: string) => void;
  newUserFullName: string;
  setNewUserFullName: (value: string) => void;
  newUserRole: UserRole;
  setNewUserRole: (role: UserRole) => void;
  onAddSubmit: () => void;
  
  isEditDialogOpen: boolean;
  setIsEditDialogOpen: (open: boolean) => void;
  selectedUser: User | null;
  editPassword: string;
  setEditPassword: (value: string) => void;
  editFullName: string;
  setEditFullName: (value: string) => void;
  editRole: UserRole;
  setEditRole: (role: UserRole) => void;
  editIsActive: boolean;
  setEditIsActive: (active: boolean) => void;
  editPhotoUrl: string;
  setEditPhotoUrl: (url: string) => void;
  editSoloPercentage: string;
  setEditSoloPercentage: (value: string) => void;
  onEditSubmit: () => void;
  
  isPermissionsDialogOpen: boolean;
  setIsPermissionsDialogOpen: (open: boolean) => void;
  userPermissions: string[];
  onPermissionToggle: (permission: string) => void;
  onPermissionsSubmit: () => void;
  
  loading: boolean;
  currentUserRole: string | null;
}

const UserManagementDialogs = ({
  isAddDialogOpen,
  setIsAddDialogOpen,
  newUserEmail,
  setNewUserEmail,
  newUserPassword,
  setNewUserPassword,
  newUserFullName,
  setNewUserFullName,
  newUserRole,
  setNewUserRole,
  onAddSubmit,
  
  isEditDialogOpen,
  setIsEditDialogOpen,
  selectedUser,
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
  onEditSubmit,
  
  isPermissionsDialogOpen,
  setIsPermissionsDialogOpen,
  userPermissions,
  onPermissionToggle,
  onPermissionsSubmit,
  
  loading,
  currentUserRole
}: UserManagementDialogsProps) => {
  return (
    <>
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
        onSubmit={onAddSubmit}
        loading={loading}
      />

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
        onSubmit={onEditSubmit}
        loading={loading}
      />

      <PermissionsDialog
        isOpen={isPermissionsDialogOpen}
        onOpenChange={setIsPermissionsDialogOpen}
        selectedUser={selectedUser}
        userPermissions={userPermissions}
        onPermissionToggle={onPermissionToggle}
        onSubmit={onPermissionsSubmit}
        loading={loading}
        currentUserRole={currentUserRole}
      />
    </>
  );
};

export default UserManagementDialogs;
