export type UserRole = 'director' | 'producer' | 'operator' | 'content_maker';

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
  MANAGE_ASSIGNMENTS: 'manage_assignments',
  MANAGE_PRODUCERS: 'manage_producers',
  VIEW_AUDIT: 'view_audit',
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
  manage_assignments: 'Назначения операторам',
  manage_producers: 'Назначения продюсерам',
  view_audit: 'История действий',
};

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  director: [
    PERMISSIONS.VIEW_HOME,
    PERMISSIONS.VIEW_MODELS,
    PERMISSIONS.VIEW_FINANCES,
    PERMISSIONS.VIEW_CHECKS,
    PERMISSIONS.VIEW_SCHEDULE,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_FILES,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_ASSIGNMENTS,
    PERMISSIONS.MANAGE_PRODUCERS,
    PERMISSIONS.VIEW_AUDIT,
  ],
  producer: [
    PERMISSIONS.VIEW_HOME,
    PERMISSIONS.VIEW_MODELS,
    PERMISSIONS.VIEW_FINANCES,
    PERMISSIONS.VIEW_CHECKS,
    PERMISSIONS.VIEW_SCHEDULE,
    PERMISSIONS.VIEW_FILES,
    PERMISSIONS.MANAGE_ASSIGNMENTS,
  ],
  operator: [
    PERMISSIONS.VIEW_HOME,
    PERMISSIONS.VIEW_MODELS,
    PERMISSIONS.VIEW_SCHEDULE,
    PERMISSIONS.VIEW_FILES,
  ],
  content_maker: [
    PERMISSIONS.VIEW_HOME,
    PERMISSIONS.VIEW_FILES,
  ],
};

export const ROLE_LABELS: Record<UserRole, string> = {
  director: 'Директор',
  producer: 'Продюссер',
  operator: 'Оператор',
  content_maker: 'Контент-мейкер',
};

export const MOCK_USERS: Record<string, User> = {
  'director@mba-corp.com': {
    email: 'director@mba-corp.com',
    role: 'director',
    permissions: ROLE_PERMISSIONS.director,
  },
  'producer@mba-corp.com': {
    email: 'producer@mba-corp.com',
    role: 'producer',
    permissions: ROLE_PERMISSIONS.producer,
  },
  'operator@mba-corp.com': {
    email: 'operator@mba-corp.com',
    role: 'operator',
    permissions: ROLE_PERMISSIONS.operator,
  },
  'content@mba-corp.com': {
    email: 'content@mba-corp.com',
    role: 'content_maker',
    permissions: ROLE_PERMISSIONS.content_maker,
  },
};

export const getUserPermissions = (email: string): string[] => {
  const user = MOCK_USERS[email];
  return user ? user.permissions : ROLE_PERMISSIONS.content_maker;
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