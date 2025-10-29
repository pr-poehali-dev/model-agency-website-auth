import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface HistoryEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  apartment?: string;
  date?: string;
  shift?: string;
  oldValue?: string;
  newValue?: string;
}

const ScheduleHistory = () => {
  const [history, setHistory] = useState<HistoryEntry[]>([
    {
      id: '1',
      timestamp: '2025-10-29 14:30',
      user: 'admin@mba.com',
      action: 'Изменение смены',
      details: 'Обновлена команда для утренней смены',
      apartment: 'Командорская 5/3',
      date: '15.09.2025',
      shift: 'Утро (10:00)',
      oldValue: 'Иван/Мария',
      newValue: 'Петр/Анна'
    },
    {
      id: '2',
      timestamp: '2025-10-29 12:15',
      user: 'operator@mba.com',
      action: 'Добавление смены',
      details: 'Назначена новая команда',
      apartment: 'Командорская 5/3',
      date: '16.09.2025',
      shift: 'День (17:00)',
      newValue: 'Алексей/Елена'
    },
    {
      id: '3',
      timestamp: '2025-10-29 10:45',
      user: 'admin@mba.com',
      action: 'Удаление смены',
      details: 'Отменена ночная смена',
      apartment: 'Командорская 5/3',
      date: '17.09.2025',
      shift: 'Ночь (00:00)',
      oldValue: 'Дмитрий/Ольга'
    }
  ]);

  const getActionIcon = (action: string) => {
    if (action.includes('Изменение')) return 'Edit';
    if (action.includes('Добавление')) return 'Plus';
    if (action.includes('Удаление')) return 'Trash2';
    return 'FileText';
  };

  const getActionColor = (action: string) => {
    if (action.includes('Изменение')) return 'bg-blue-500/20 text-blue-400';
    if (action.includes('Добавление')) return 'bg-green-500/20 text-green-400';
    if (action.includes('Удаление')) return 'bg-red-500/20 text-red-400';
    return 'bg-gray-500/20 text-gray-400';
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Icon name="History" size={16} />
          История изменений
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>История изменений расписания</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {history.map((entry) => (
              <Card key={entry.id} className="p-4">
                <div className="flex gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getActionColor(entry.action)}`}>
                    <Icon name={getActionIcon(entry.action)} size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-foreground">{entry.action}</h4>
                        <p className="text-sm text-muted-foreground">{entry.details}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {entry.timestamp}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                      {entry.apartment && (
                        <div>
                          <span className="text-muted-foreground">Квартира:</span>
                          <p className="font-medium text-foreground">{entry.apartment}</p>
                        </div>
                      )}
                      {entry.date && (
                        <div>
                          <span className="text-muted-foreground">Дата:</span>
                          <p className="font-medium text-foreground">{entry.date}</p>
                        </div>
                      )}
                      {entry.shift && (
                        <div>
                          <span className="text-muted-foreground">Смена:</span>
                          <p className="font-medium text-foreground">{entry.shift}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">Пользователь:</span>
                        <p className="font-medium text-foreground">{entry.user}</p>
                      </div>
                    </div>

                    {(entry.oldValue || entry.newValue) && (
                      <div className="mt-3 flex items-center gap-2 text-sm">
                        {entry.oldValue && (
                          <>
                            <Badge variant="secondary" className="font-mono">
                              {entry.oldValue}
                            </Badge>
                            <Icon name="ArrowRight" size={14} className="text-muted-foreground" />
                          </>
                        )}
                        {entry.newValue && (
                          <Badge variant="default" className="font-mono">
                            {entry.newValue}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleHistory;
