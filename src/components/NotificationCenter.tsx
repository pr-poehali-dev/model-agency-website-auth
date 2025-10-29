import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'shooting' | 'schedule' | 'system';
  time: string;
  read: boolean;
}

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Предстоящая съёмка',
      message: 'Съёмка в Командорская 5/3, 42 кв. начнется через 2 часа',
      type: 'shooting',
      time: '10 минут назад',
      read: false
    },
    {
      id: '2',
      title: 'Изменение расписания',
      message: 'Смена на 16.09 перенесена на другое время',
      type: 'schedule',
      time: '1 час назад',
      read: false
    },
    {
      id: '3',
      title: 'Новое назначение',
      message: 'Вам назначена новая модель для съёмки',
      type: 'system',
      time: '3 часа назад',
      read: true
    }
  ]);

  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'shooting': return 'Camera';
      case 'schedule': return 'Calendar';
      case 'system': return 'Bell';
      default: return 'Bell';
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Icon name="Bell" size={20} />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              variant="destructive"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Уведомления</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-xs"
            >
              Прочитать все
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          <div className="p-2">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Icon name="Bell" size={48} className="mx-auto mb-2 opacity-50" />
                <p>Нет уведомлений</p>
              </div>
            ) : (
              notifications.map(notification => (
                <Card 
                  key={notification.id}
                  className={`p-3 mb-2 cursor-pointer hover:bg-accent/50 transition-colors ${
                    !notification.read ? 'bg-accent/20' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex gap-3">
                    <div className={`mt-1 ${!notification.read ? 'text-primary' : 'text-muted-foreground'}`}>
                      <Icon name={getIconForType(notification.type)} size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-medium text-sm text-foreground">{notification.title}</h4>
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-primary mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{notification.message}</p>
                      <span className="text-xs text-muted-foreground">{notification.time}</span>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter;
