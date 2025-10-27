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
} as const;

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: [
    PERMISSIONS.VIEW_HOME,
    PERMISSIONS.VIEW_MODELS,
    PERMISSIONS.VIEW_FINANCES,
    PERMISSIONS.VIEW_CHECKS,
    PERMISSIONS.VIEW_SCHEDULE,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_FILES,
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
