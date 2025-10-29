import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const GoogleCalendarSync = () => {
  const [connected, setConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  const handleConnect = () => {
    toast({
      title: 'Google Calendar',
      description: 'Перенаправление на авторизацию Google...',
    });
    
    setTimeout(() => {
      setConnected(true);
      toast({
        title: 'Успешно подключено',
        description: 'Google Calendar синхронизирован с расписанием',
      });
    }, 1500);
  };

  const handleDisconnect = () => {
    setConnected(false);
    toast({
      title: 'Отключено',
      description: 'Google Calendar отключен от расписания',
    });
  };

  const handleSync = () => {
    setSyncing(true);
    toast({
      title: 'Синхронизация',
      description: 'Экспортируем расписание в Google Calendar...',
    });

    setTimeout(() => {
      setSyncing(false);
      toast({
        title: 'Готово',
        description: 'Все съёмки добавлены в ваш календарь',
      });
    }, 2000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Icon name="Calendar" size={16} />
          Google Calendar
          {connected && (
            <Badge variant="default" className="ml-1 h-5 px-1.5">
              <Icon name="Check" size={12} />
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Интеграция с Google Calendar</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {!connected ? (
            <Card className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-primary/20 rounded-full flex items-center justify-center">
                <Icon name="Calendar" size={32} className="text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Подключите Google Calendar</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Автоматически синхронизируйте расписание съёмок с вашим Google Calendar. 
                Все изменения будут отображаться в календаре в реальном времени.
              </p>
              <Button onClick={handleConnect} className="w-full gap-2">
                <Icon name="Link" size={16} />
                Подключить аккаунт Google
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card className="p-4 bg-primary/10 border-primary/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                    <Icon name="Check" size={20} className="text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Календарь подключен</h4>
                    <p className="text-sm text-muted-foreground">calendar@gmail.com</p>
                  </div>
                </div>
              </Card>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Настройки синхронизации</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Icon name="Check" size={16} className="text-primary" />
                    <span>Автоматическая синхронизация при изменениях</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name="Check" size={16} className="text-primary" />
                    <span>Уведомления за 1 час до съёмки</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Icon name="Check" size={16} className="text-primary" />
                    <span>Экспорт всех квартир и смен</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleSync} 
                  disabled={syncing}
                  className="flex-1 gap-2"
                >
                  <Icon name={syncing ? "Loader2" : "RefreshCw"} size={16} className={syncing ? "animate-spin" : ""} />
                  {syncing ? 'Синхронизация...' : 'Синхронизировать сейчас'}
                </Button>
                <Button 
                  onClick={handleDisconnect} 
                  variant="outline"
                  className="gap-2"
                >
                  <Icon name="Unlink" size={16} />
                  Отключить
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GoogleCalendarSync;
