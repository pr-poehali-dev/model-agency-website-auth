import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { authenticatedFetch } from '@/lib/api';

interface Notification {
  id: string;
  type: 'assignment' | 'producer' | 'task' | 'task_done';
  message: string;
  timestamp: Date;
  read: boolean;
}

const ASSIGNMENTS_API_URL = 'https://functions.poehali.dev/b7d8dd69-ab09-460d-999b-c0a1002ced30';
const PRODUCER_API_URL = 'https://functions.poehali.dev/a480fde5-8cc8-42e8-a535-626e393f6fa6';
const USERS_API_URL = 'https://functions.poehali.dev/67fd6902-6170-487e-bb46-f6d14ec99066';
const TASKS_API_URL = 'https://functions.poehali.dev/7de9b994-871a-4c9d-9260-edcb005ce100';

interface NotificationBellProps {
  onTaskClick?: () => void;
}

const NotificationBell = ({ onTaskClick }: NotificationBellProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const lastCheckRef = useRef<Date>(new Date());
  const userEmail = localStorage.getItem('userEmail') || '';

  const checkTaskNotifications = useCallback(async (currentUserRole: string) => {
    const result: Notification[] = [];
    try {
      const token = localStorage.getItem('authToken');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-User-Email': userEmail,
        'X-User-Role': currentUserRole,
      };
      if (token) headers['X-Auth-Token'] = token;

      const res = await fetch(TASKS_API_URL, { headers });
      if (!res.ok) return result;

      const tasks = await res.json();
      const lastCheck = lastCheckRef.current;

      for (const t of tasks) {
        if (
          t.assignedToEmail === userEmail &&
          t.status !== 'completed' &&
          new Date(t.createdAt) > lastCheck
        ) {
          result.push({
            id: `task-new-${t.id}`,
            type: 'task',
            message: `Новая задача: ${t.title} (от ${t.assignedByName || t.assignedByEmail})`,
            timestamp: new Date(t.createdAt),
            read: false,
          });
        }

        if (
          t.assignedByEmail === userEmail &&
          t.assignedToEmail !== userEmail &&
          t.status === 'completed' &&
          t.completedAt &&
          new Date(t.completedAt) > lastCheck
        ) {
          result.push({
            id: `task-done-${t.id}`,
            type: 'task_done',
            message: `Задача выполнена: ${t.title} (${t.assignedToName || t.assignedToEmail})`,
            timestamp: new Date(t.completedAt),
            read: false,
          });
        }
      }
    } catch {
      // ignore
    }
    return result;
  }, [userEmail]);

  const checkAll = useCallback(async () => {
    try {
      const usersResponse = await authenticatedFetch(USERS_API_URL);
      const users = await usersResponse.json();
      const currentUser = users.find((u: { email: string }) => u.email === userEmail);
      if (!currentUser) return;

      const newNotifications: Notification[] = [];
      const lastCheck = lastCheckRef.current;

      if (currentUser.role === 'operator') {
        const assignmentsResponse = await authenticatedFetch(ASSIGNMENTS_API_URL);
        const assignments = await assignmentsResponse.json();
        for (const a of assignments) {
          if (a.operatorEmail === userEmail && new Date(a.assignedAt) > lastCheck) {
            const model = users.find((u: { id: number }) => u.id === a.modelId);
            if (model) {
              newNotifications.push({
                id: `assignment-${a.id}`,
                type: 'assignment',
                message: `Вас назначили на модель ${model.fullName || model.email}`,
                timestamp: new Date(a.assignedAt),
                read: false,
              });
            }
          }
        }

        const producerResponse = await authenticatedFetch(`${PRODUCER_API_URL}?type=operator`);
        const producerAssignments = await producerResponse.json();
        const pa = producerAssignments.find(
          (p: { operatorEmail: string; assignedAt: string }) =>
            p.operatorEmail === userEmail && new Date(p.assignedAt) > lastCheck
        );
        if (pa) {
          const producer = users.find((u: { email: string }) => u.email === pa.producerEmail);
          if (producer) {
            newNotifications.push({
              id: `producer-${pa.id}`,
              type: 'producer',
              message: `Ваш продюсер: ${producer.fullName || producer.email}`,
              timestamp: new Date(pa.assignedAt),
              read: false,
            });
          }
        }
      }

      if (currentUser.role === 'content_maker') {
        const producerResponse = await authenticatedFetch(`${PRODUCER_API_URL}?type=model`);
        const producerAssignments = await producerResponse.json();
        const mpa = producerAssignments.find(
          (p: { modelEmail: string; assignedAt: string }) =>
            p.modelEmail === userEmail && new Date(p.assignedAt) > lastCheck
        );
        if (mpa) {
          const producer = users.find((u: { email: string }) => u.email === mpa.producerEmail);
          if (producer) {
            newNotifications.push({
              id: `producer-model-${mpa.id}`,
              type: 'producer',
              message: `Вас закрепили за продюсером ${producer.fullName || producer.email}`,
              timestamp: new Date(mpa.assignedAt),
              read: false,
            });
          }
        }

        const assignmentsResponse = await authenticatedFetch(ASSIGNMENTS_API_URL);
        const assignments = await assignmentsResponse.json();
        for (const a of assignments) {
          const model = users.find((u: { id: number; email: string }) => u.id === a.modelId);
          if (model?.email === userEmail && new Date(a.assignedAt) > lastCheck) {
            const operator = users.find((u: { email: string }) => u.email === a.operatorEmail);
            if (operator) {
              newNotifications.push({
                id: `operator-${a.id}`,
                type: 'assignment',
                message: `С вами работает оператор ${operator.fullName || operator.email}`,
                timestamp: new Date(a.assignedAt),
                read: false,
              });
            }
          }
        }
      }

      const taskNotifs = await checkTaskNotifications(currentUser.role);
      newNotifications.push(...taskNotifs);

      if (newNotifications.length > 0) {
        setNotifications(prev => {
          const existingIds = new Set(prev.map(n => n.id));
          const unique = newNotifications.filter(n => !existingIds.has(n.id));
          return [...unique, ...prev];
        });
      }

      lastCheckRef.current = new Date();
    } catch (error) {
      console.error('Failed to check notifications:', error);
    }
  }, [userEmail, checkTaskNotifications]);

  useEffect(() => {
    if (userEmail) {
      checkAll();
      const interval = setInterval(checkAll, 30000);
      const onTaskEvent = () => { setTimeout(checkAll, 500); };
      window.addEventListener('task-changed', onTaskEvent);
      return () => { clearInterval(interval); window.removeEventListener('task-changed', onTaskEvent); };
    }
  }, [userEmail, checkAll]);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if ((notification.type === 'task' || notification.type === 'task_done') && onTaskClick) {
      onTaskClick();
      setIsOpen(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'assignment': return 'UserCheck';
      case 'producer': return 'Star';
      case 'task': return 'ClipboardList';
      case 'task_done': return 'CheckCircle';
      default: return 'Info';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'assignment': return { bg: 'bg-emerald-500/10', text: 'text-emerald-600' };
      case 'producer': return { bg: 'bg-amber-500/10', text: 'text-amber-600' };
      case 'task': return { bg: 'bg-blue-500/10', text: 'text-blue-600' };
      case 'task_done': return { bg: 'bg-green-500/10', text: 'text-green-600' };
      default: return { bg: 'bg-gray-500/10', text: 'text-gray-600' };
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Icon name="Bell" size={20} />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold">Уведомления</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-7 text-xs">
              Прочитать всё
            </Button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Icon name="Bell" size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Нет новых уведомлений</p>
            </div>
          ) : (
            notifications.map(notification => {
              const colors = getIconColor(notification.type);
              return (
                <DropdownMenuItem
                  key={notification.id}
                  className={`p-3 cursor-pointer ${!notification.read ? 'bg-accent/30' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3 w-full">
                    <div className={`p-2 rounded-lg ${colors.bg}`}>
                      <Icon name={getIcon(notification.type)} size={16} className={colors.text} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.timestamp.toLocaleString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    {!notification.read && <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />}
                  </div>
                </DropdownMenuItem>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;