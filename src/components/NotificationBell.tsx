import { useState, useEffect, useCallback } from 'react';
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
  type: 'assignment' | 'producer' | 'task';
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
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const userEmail = localStorage.getItem('userEmail') || '';

  const getTaskHeaders = useCallback(() => {
    const token = localStorage.getItem('authToken');
    const h: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-User-Email': userEmail,
    };
    if (token) h['X-Auth-Token'] = token;
    return h;
  }, [userEmail]);

  const checkNewTasks = useCallback(async () => {
    try {
      const res = await fetch(TASKS_API_URL, { headers: getTaskHeaders() });
      if (!res.ok) return [];

      const tasks = await res.json();
      const newTasks = tasks.filter((t: { assignedToEmail: string; createdAt: string }) =>
        t.assignedToEmail === userEmail && new Date(t.createdAt) > lastCheck
      );

      return newTasks.map((t: { id: number; title: string; assignedByName: string; assignedByEmail: string; createdAt: string }) => ({
        id: `task-${t.id}`,
        type: 'task' as const,
        message: `Новая задача: ${t.title} (от ${t.assignedByName || t.assignedByEmail})`,
        timestamp: new Date(t.createdAt),
        read: false,
      }));
    } catch {
      return [];
    }
  }, [userEmail, lastCheck, getTaskHeaders]);

  const checkNewAssignments = useCallback(async () => {
    try {
      const usersResponse = await authenticatedFetch(USERS_API_URL);
      const users = await usersResponse.json();
      const currentUser = users.find((u: { email: string }) => u.email === userEmail);

      if (!currentUser) return;

      const newNotifications: Notification[] = [];

      if (currentUser.role === 'operator') {
        const assignmentsResponse = await authenticatedFetch(ASSIGNMENTS_API_URL);
        const assignments = await assignmentsResponse.json();
        const userAssignments = assignments.filter((a: { operatorEmail: string; assignedAt: string }) =>
          a.operatorEmail === userEmail && new Date(a.assignedAt) > lastCheck
        );

        for (const assignment of userAssignments) {
          const model = users.find((u: { id: number }) => u.id === assignment.modelId);
          if (model) {
            newNotifications.push({
              id: `assignment-${assignment.id}`,
              type: 'assignment',
              message: `Вас назначили на модель ${model.fullName || model.email}`,
              timestamp: new Date(assignment.assignedAt),
              read: false,
            });
          }
        }

        const producerResponse = await authenticatedFetch(`${PRODUCER_API_URL}?type=operator`);
        const producerAssignments = await producerResponse.json();
        const userProducerAssignment = producerAssignments.find(
          (pa: { operatorEmail: string; assignedAt: string }) => pa.operatorEmail === userEmail && new Date(pa.assignedAt) > lastCheck
        );

        if (userProducerAssignment) {
          const producer = users.find((u: { email: string }) => u.email === userProducerAssignment.producerEmail);
          if (producer) {
            newNotifications.push({
              id: `producer-${userProducerAssignment.id}`,
              type: 'producer',
              message: `Ваш продюсер: ${producer.fullName || producer.email}`,
              timestamp: new Date(userProducerAssignment.assignedAt),
              read: false,
            });
          }
        }
      }

      if (currentUser.role === 'content_maker') {
        const producerResponse = await authenticatedFetch(`${PRODUCER_API_URL}?type=model`);
        const producerAssignments = await producerResponse.json();
        const modelProducerAssignment = producerAssignments.find(
          (pa: { modelEmail: string; assignedAt: string }) => pa.modelEmail === userEmail && new Date(pa.assignedAt) > lastCheck
        );

        if (modelProducerAssignment) {
          const producer = users.find((u: { email: string }) => u.email === modelProducerAssignment.producerEmail);
          if (producer) {
            newNotifications.push({
              id: `producer-model-${modelProducerAssignment.id}`,
              type: 'producer',
              message: `Вас закрепили за продюсером ${producer.fullName || producer.email}`,
              timestamp: new Date(modelProducerAssignment.assignedAt),
              read: false,
            });
          }
        }

        const assignmentsResponse = await authenticatedFetch(ASSIGNMENTS_API_URL);
        const assignments = await assignmentsResponse.json();
        const modelAssignments = assignments.filter((a: { modelId: number; assignedAt: string }) => {
          const model = users.find((u: { id: number; email: string }) => u.id === a.modelId);
          return model?.email === userEmail && new Date(a.assignedAt) > lastCheck;
        });

        for (const assignment of modelAssignments) {
          const operator = users.find((u: { email: string }) => u.email === assignment.operatorEmail);
          if (operator) {
            newNotifications.push({
              id: `operator-${assignment.id}`,
              type: 'assignment',
              message: `С вами работает оператор ${operator.fullName || operator.email}`,
              timestamp: new Date(assignment.assignedAt),
              read: false,
            });
          }
        }
      }

      const taskNotifications = await checkNewTasks();
      newNotifications.push(...taskNotifications);

      if (newNotifications.length > 0) {
        setNotifications(prev => {
          const existingIds = new Set(prev.map(n => n.id));
          const unique = newNotifications.filter(n => !existingIds.has(n.id));
          return [...unique, ...prev];
        });
      }

      setLastCheck(new Date());
    } catch (error) {
      console.error('Failed to check notifications:', error);
    }
  }, [userEmail, lastCheck, checkNewTasks]);

  useEffect(() => {
    if (userEmail) {
      checkNewAssignments();
      const interval = setInterval(checkNewAssignments, 30000);
      return () => clearInterval(interval);
    }
  }, [userEmail]);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.type === 'task' && onTaskClick) {
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
      default: return 'Info';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'assignment': return { bg: 'bg-emerald-500/10', text: 'text-emerald-600' };
      case 'producer': return { bg: 'bg-amber-500/10', text: 'text-amber-600' };
      case 'task': return { bg: 'bg-blue-500/10', text: 'text-blue-600' };
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
