export type UserRole = 'admin' | 'manager' | 'viewer';

export interface User {
  email: string;
  role: UserRole;
  permissions: string[];
}

export const PERMISSIONS = {
  VIEW_HOME: 'view_home',
  VIEW_MODELS: 'view_models',
  VIEW_FINANCES: 'view_finances',
  VIEW_CHECKS: 'view_checks',
  VIEW_SCHEDULE: 'view_schedule',
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_FILES: 'view_files',
  MANAGE_USERS: 'manage_users',
} as const;

export const PERMISSION_LABELS: Record<string, string> = {
  view_home: 'Главная',
  view_models: 'Модели',
  view_finances: 'Финансы',
  view_checks: 'Чеки',
  view_schedule: 'Расписание',
  view_dashboard: 'Dashboard',
  view_files: 'Файлы',
  manage_users: 'Управление пользователями',
};

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: [
    PERMISSIONS.VIEW_HOME,
    PERMISSIONS.VIEW_MODELS,
    PERMISSIONS.VIEW_FINANCES,
    PERMISSIONS.VIEW_CHECKS,
    PERMISSIONS.VIEW_SCHEDULE,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_FILES,
    PERMISSIONS.MANAGE_USERS,
  ],
  manager: [
    PERMISSIONS.VIEW_HOME,
    PERMISSIONS.VIEW_MODELS,
    PERMISSIONS.VIEW_SCHEDULE,
    PERMISSIONS.VIEW_FILES,
  ],
  viewer: [
    PERMISSIONS.VIEW_HOME,
    PERMISSIONS.VIEW_MODELS,
  ],
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Администратор',
  manager: 'Менеджер',
  viewer: 'Наблюдатель',
};

export const MOCK_USERS: Record<string, User> = {
  'admin@mba-corp.com': {
    email: 'admin@mba-corp.com',
    role: 'admin',
    permissions: ROLE_PERMISSIONS.admin,
  },
  'manager@mba-corp.com': {
    email: 'manager@mba-corp.com',
    role: 'manager',
    permissions: ROLE_PERMISSIONS.manager,
  },
  'viewer@mba-corp.com': {
    email: 'viewer@mba-corp.com',
    role: 'viewer',
    permissions: ROLE_PERMISSIONS.viewer,
  },
};

export const getUserPermissions = (email: string): string[] => {
  const user = MOCK_USERS[email];
  return user ? user.permissions : ROLE_PERMISSIONS.viewer;
};

export const hasPermission = (email: string, permission: string): boolean => {
  const permissions = getUserPermissions(email);
  return permissions.includes(permission);
};

export const getAllUsers = (): User[] => {
  return Object.values(MOCK_USERS);
};

export const updateUserRole = (email: string, newRole: UserRole): void => {
  if (MOCK_USERS[email]) {
    MOCK_USERS[email].role = newRole;
    MOCK_USERS[email].permissions = ROLE_PERMISSIONS[newRole];
  }
};

export const updateUserPermissions = (email: string, permissions: string[]): void => {
  if (MOCK_USERS[email]) {
    MOCK_USERS[email].permissions = permissions;
  }
};

export const addUser = (email: string, role: UserRole): void => {
  MOCK_USERS[email] = {
    email,
    role,
    permissions: ROLE_PERMISSIONS[role],
  };
};

export const deleteUser = (email: string): void => {
  delete MOCK_USERS[email];
};