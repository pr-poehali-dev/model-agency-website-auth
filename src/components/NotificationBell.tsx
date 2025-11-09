import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Notification {
  id: string;
  type: 'assignment' | 'producer' | 'info';
  message: string;
  timestamp: Date;
  read: boolean;
}

const ASSIGNMENTS_API_URL = 'https://functions.poehali.dev/b7d8dd69-ab09-460d-999b-c0a1002ced30';
const PRODUCER_API_URL = 'https://functions.poehali.dev/a480fde5-8cc8-42e8-a535-626e393f6fa6';
const USERS_API_URL = 'https://functions.poehali.dev/67fd6902-6170-487e-bb46-f6d14ec99066';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const userEmail = localStorage.getItem('userEmail') || '';

  useEffect(() => {
    if (userEmail) {
      checkNewAssignments();
      const interval = setInterval(checkNewAssignments, 30000);
      return () => clearInterval(interval);
    }
  }, [userEmail]);

  const checkNewAssignments = async () => {
    try {
      const usersResponse = await fetch(USERS_API_URL);
      const users = await usersResponse.json();
      const currentUser = users.find((u: any) => u.email === userEmail);
      
      if (!currentUser) return;

      const newNotifications: Notification[] = [];

      if (currentUser.role === 'operator') {
        const assignmentsResponse = await fetch(ASSIGNMENTS_API_URL);
        const assignments = await assignmentsResponse.json();
        const userAssignments = assignments.filter((a: any) => 
          a.operatorEmail === userEmail && 
          new Date(a.assignedAt) > lastCheck
        );

        for (const assignment of userAssignments) {
          const model = users.find((u: any) => u.id === assignment.modelId);
          if (model) {
            newNotifications.push({
              id: `assignment-${assignment.id}`,
              type: 'assignment',
              message: `Вас назначили на модель ${model.fullName || model.email}`,
              timestamp: new Date(assignment.assignedAt),
              read: false
            });
          }
        }

        const producerResponse = await fetch(`${PRODUCER_API_URL}?type=operator`);
        const producerAssignments = await producerResponse.json();
        const userProducerAssignment = producerAssignments.find(
          (pa: any) => pa.operatorEmail === userEmail && new Date(pa.assignedAt) > lastCheck
        );

        if (userProducerAssignment) {
          const producer = users.find((u: any) => u.email === userProducerAssignment.producerEmail);
          if (producer) {
            newNotifications.push({
              id: `producer-${userProducerAssignment.id}`,
              type: 'producer',
              message: `Ваш продюсер: ${producer.fullName || producer.email}`,
              timestamp: new Date(userProducerAssignment.assignedAt),
              read: false
            });
          }
        }
      }

      if (currentUser.role === 'content_maker') {
        const producerResponse = await fetch(`${PRODUCER_API_URL}?type=model`);
        const producerAssignments = await producerResponse.json();
        const modelProducerAssignment = producerAssignments.find(
          (pa: any) => pa.modelEmail === userEmail && new Date(pa.assignedAt) > lastCheck
        );

        if (modelProducerAssignment) {
          const producer = users.find((u: any) => u.email === modelProducerAssignment.producerEmail);
          if (producer) {
            newNotifications.push({
              id: `producer-model-${modelProducerAssignment.id}`,
              type: 'producer',
              message: `Вас закрепили за продюсером ${producer.fullName || producer.email}`,
              timestamp: new Date(modelProducerAssignment.assignedAt),
              read: false
            });
          }
        }

        const assignmentsResponse = await fetch(ASSIGNMENTS_API_URL);
        const assignments = await assignmentsResponse.json();
        const modelAssignments = assignments.filter((a: any) => {
          const model = users.find((u: any) => u.id === a.modelId);
          return model?.email === userEmail && new Date(a.assignedAt) > lastCheck;
        });

        for (const assignment of modelAssignments) {
          const operator = users.find((u: any) => u.email === assignment.operatorEmail);
          if (operator) {
            newNotifications.push({
              id: `operator-${assignment.id}`,
              type: 'assignment',
              message: `С вами работает оператор ${operator.fullName || operator.email}`,
              timestamp: new Date(assignment.assignedAt),
              read: false
            });
          }
        }
      }

      if (newNotifications.length > 0) {
        setNotifications(prev => [...newNotifications, ...prev]);
      }
      
      setLastCheck(new Date());
    } catch (error) {
      console.error('Failed to check notifications:', error);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'assignment': return 'UserCheck';
      case 'producer': return 'Star';
      default: return 'Info';
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
            notifications.map(notification => (
              <DropdownMenuItem
                key={notification.id}
                className={`p-3 cursor-pointer ${!notification.read ? 'bg-accent/30' : ''}`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex gap-3 w-full">
                  <div className={`p-2 rounded-lg ${
                    notification.type === 'assignment' ? 'bg-emerald-500/10' : 
                    notification.type === 'producer' ? 'bg-amber-500/10' : 
                    'bg-gray-500/10'
                  }`}>
                    <Icon 
                      name={getIcon(notification.type)} 
                      size={16} 
                      className={
                        notification.type === 'assignment' ? 'text-emerald-600' : 
                        notification.type === 'producer' ? 'text-amber-600' : 
                        'text-gray-600'
                      }
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.timestamp.toLocaleString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  )}
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationBell;