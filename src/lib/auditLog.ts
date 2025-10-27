export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  userEmail: string;
  action: string;
  details: string;
  category: 'auth' | 'users' | 'models' | 'finances' | 'system';
}

let auditLogs: AuditLogEntry[] = [
  {
    id: '1',
    timestamp: new Date('2025-10-27T10:30:00'),
    userEmail: 'admin@mba-corp.com',
    action: 'Вход в систему',
    details: 'Успешная авторизация',
    category: 'auth'
  },
  {
    id: '2',
    timestamp: new Date('2025-10-27T10:35:00'),
    userEmail: 'admin@mba-corp.com',
    action: 'Добавление пользователя',
    details: 'Добавлен пользователь manager@mba-corp.com с ролью manager',
    category: 'users'
  },
  {
    id: '3',
    timestamp: new Date('2025-10-27T10:40:00'),
    userEmail: 'manager@mba-corp.com',
    action: 'Вход в систему',
    details: 'Успешная авторизация',
    category: 'auth'
  },
  {
    id: '4',
    timestamp: new Date('2025-10-27T11:15:00'),
    userEmail: 'admin@mba-corp.com',
    action: 'Изменение роли',
    details: 'Роль пользователя viewer@mba-corp.com изменена на manager',
    category: 'users'
  },
  {
    id: '5',
    timestamp: new Date('2025-10-27T11:20:00'),
    userEmail: 'manager@mba-corp.com',
    action: 'Просмотр моделей',
    details: 'Открыт раздел "Модели"',
    category: 'models'
  },
  {
    id: '6',
    timestamp: new Date('2025-10-27T11:45:00'),
    userEmail: 'admin@mba-corp.com',
    action: 'Просмотр финансов',
    details: 'Открыт раздел "Финансы"',
    category: 'finances'
  },
  {
    id: '7',
    timestamp: new Date('2025-10-27T12:00:00'),
    userEmail: 'admin@mba-corp.com',
    action: 'Изменение прав',
    details: 'Обновлены права доступа для manager@mba-corp.com',
    category: 'users'
  },
];

export const addAuditLog = (
  userEmail: string,
  action: string,
  details: string,
  category: AuditLogEntry['category']
): void => {
  const newLog: AuditLogEntry = {
    id: Date.now().toString(),
    timestamp: new Date(),
    userEmail,
    action,
    details,
    category,
  };
  auditLogs = [newLog, ...auditLogs];
};

export const getAuditLogs = (limit?: number): AuditLogEntry[] => {
  return limit ? auditLogs.slice(0, limit) : auditLogs;
};

export const getAuditLogsByUser = (userEmail: string): AuditLogEntry[] => {
  return auditLogs.filter(log => log.userEmail === userEmail);
};

export const getAuditLogsByCategory = (category: AuditLogEntry['category']): AuditLogEntry[] => {
  return auditLogs.filter(log => log.category === category);
};

export const clearAuditLogs = (): void => {
  auditLogs = [];
};
