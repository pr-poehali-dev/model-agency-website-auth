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

const TASKS_API_URL = 'https://functions.poehali.dev/7de9b994-871a-4c9d-9260-edcb005ce100';

interface Notification {
  id: string;
  type: 'task' | 'task_done' | 'task_progress' | 'task_comment';
  message: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationBellProps {
  userRole?: string;
  onTaskClick?: () => void;
}

const NotificationBell = ({ userRole, onTaskClick }: NotificationBellProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const snapshotRef = useRef<Map<number, { status: string; commentCount: number }>>(new Map());
  const isFirstRunRef = useRef(true);
  const userEmail = localStorage.getItem('userEmail') || '';

  const checkTasks = useCallback(async () => {
    if (!userEmail || !userRole) return;
    try {
      const token = localStorage.getItem('authToken');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-User-Email': userEmail,
        'X-User-Role': userRole,
      };
      if (token) headers['X-Auth-Token'] = token;

      const res = await fetch(TASKS_API_URL, { headers });
      if (!res.ok) return;

      const tasks = await res.json();
      const newNotifications: Notification[] = [];
      const prev = snapshotRef.current;
      const next = new Map<number, { status: string; commentCount: number }>();

      for (const t of tasks) {
        const cc = t.commentCount ?? 0;
        next.set(t.id, { status: t.status, commentCount: cc });

        if (isFirstRunRef.current) continue;

        const old = prev.get(t.id);
        const iAmAssigner = t.assignedByEmail === userEmail && t.assignedToEmail !== userEmail;
        const iAmAssignee = t.assignedToEmail === userEmail;

        if (!old && iAmAssignee && t.status !== 'completed') {
          newNotifications.push({
            id: `task-new-${t.id}-${Date.now()}`,
            type: 'task',
            message: `Новая задача: ${t.title} (от ${t.assignedByName || t.assignedByEmail})`,
            timestamp: new Date(t.createdAt),
            read: false,
          });
        }

        if (old && iAmAssigner && old.status !== 'completed' && t.status === 'completed') {
          newNotifications.push({
            id: `done-${t.id}-${Date.now()}`,
            type: 'task_done',
            message: `Задача выполнена: ${t.title} (${t.assignedToName || t.assignedToEmail})`,
            timestamp: new Date(),
            read: false,
          });
        }

        if (old && iAmAssigner && old.status === 'pending' && t.status === 'in_progress') {
          newNotifications.push({
            id: `progress-${t.id}-${Date.now()}`,
            type: 'task_progress',
            message: `Взята в работу: ${t.title} (${t.assignedToName || t.assignedToEmail})`,
            timestamp: new Date(),
            read: false,
          });
        }

        if (old && cc > old.commentCount) {
          const newCount = cc - old.commentCount;
          const shouldNotify = iAmAssigner || iAmAssignee;
          if (shouldNotify) {
            newNotifications.push({
              id: `comment-${t.id}-${Date.now()}`,
              type: 'task_comment',
              message: `${newCount > 1 ? `${newCount} новых комментариев` : 'Новый комментарий'}: ${t.title}`,
              timestamp: new Date(),
              read: false,
            });
          }
        }
      }

      snapshotRef.current = next;
      isFirstRunRef.current = false;

      if (newNotifications.length > 0) {
        setNotifications(p => [...newNotifications, ...p]);
      }
    } catch (err) {
      console.error('NotificationBell: check failed', err);
    }
  }, [userEmail, userRole]);

  useEffect(() => {
    if (!userEmail || !userRole) return;

    checkTasks();
    const interval = setInterval(checkTasks, 15000);
    const onTaskEvent = () => { setTimeout(checkTasks, 800); };
    window.addEventListener('task-changed', onTaskEvent);
    return () => { clearInterval(interval); window.removeEventListener('task-changed', onTaskEvent); };
  }, [userEmail, userRole, checkTasks]);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (onTaskClick) {
      onTaskClick();
      setIsOpen(false);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'task': return 'ClipboardList';
      case 'task_done': return 'CheckCircle';
      case 'task_progress': return 'Play';
      case 'task_comment': return 'MessageSquare';
      default: return 'Info';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'task': return { bg: 'bg-blue-500/10', text: 'text-blue-600' };
      case 'task_done': return { bg: 'bg-green-500/10', text: 'text-green-600' };
      case 'task_progress': return { bg: 'bg-orange-500/10', text: 'text-orange-600' };
      case 'task_comment': return { bg: 'bg-purple-500/10', text: 'text-purple-600' };
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