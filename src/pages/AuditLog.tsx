import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getAuditLogs, getAuditLogsByCategory, type AuditLogEntry } from '@/lib/auditLog';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const categoryColors: Record<AuditLogEntry['category'], string> = {
  auth: 'bg-blue-500/20 text-blue-500 hover:bg-blue-500/30',
  users: 'bg-purple-500/20 text-purple-500 hover:bg-purple-500/30',
  models: 'bg-green-500/20 text-green-500 hover:bg-green-500/30',
  finances: 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30',
  system: 'bg-gray-500/20 text-gray-500 hover:bg-gray-500/30',
};

const categoryIcons: Record<AuditLogEntry['category'], string> = {
  auth: 'LogIn',
  users: 'Users',
  models: 'User',
  finances: 'DollarSign',
  system: 'Settings',
};

const categoryLabels: Record<AuditLogEntry['category'], string> = {
  auth: 'Авторизация',
  users: 'Пользователи',
  models: 'Модели',
  finances: 'Финансы',
  system: 'Система',
};

const AuditLog = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [filter, setFilter] = useState<'all' | AuditLogEntry['category']>('all');

  useEffect(() => {
    loadLogs();
  }, [filter]);

  const loadLogs = () => {
    if (filter === 'all') {
      setLogs(getAuditLogs());
    } else {
      setLogs(getAuditLogsByCategory(filter));
    }
  };

  const getCategoryStats = () => {
    const allLogs = getAuditLogs();
    return {
      auth: allLogs.filter(log => log.category === 'auth').length,
      users: allLogs.filter(log => log.category === 'users').length,
      models: allLogs.filter(log => log.category === 'models').length,
      finances: allLogs.filter(log => log.category === 'finances').length,
      system: allLogs.filter(log => log.category === 'system').length,
    };
  };

  const stats = getCategoryStats();

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="text-4xl font-serif font-bold text-foreground mb-2">История действий</h2>
        <p className="text-muted-foreground">Журнал всех действий пользователей в системе</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        {Object.entries(stats).map(([category, count]) => (
          <Card
            key={category}
            className={`p-4 cursor-pointer transition-all ${
              filter === category ? 'border-primary ring-2 ring-primary/20' : 'hover:border-primary/50'
            }`}
            onClick={() => setFilter(category as AuditLogEntry['category'])}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${categoryColors[category as AuditLogEntry['category']]} flex items-center justify-center`}>
                <Icon name={categoryIcons[category as AuditLogEntry['category']]} size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{count}</p>
                <p className="text-xs text-muted-foreground">{categoryLabels[category as AuditLogEntry['category']]}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Select value={filter} onValueChange={(value) => setFilter(value as any)}>
            <SelectTrigger className="w-[200px] bg-input border-border">
              <SelectValue placeholder="Фильтр по категории" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">Все категории</SelectItem>
              <SelectItem value="auth">Авторизация</SelectItem>
              <SelectItem value="users">Пользователи</SelectItem>
              <SelectItem value="models">Модели</SelectItem>
              <SelectItem value="finances">Финансы</SelectItem>
              <SelectItem value="system">Система</SelectItem>
            </SelectContent>
          </Select>
          {filter !== 'all' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilter('all')}
              className="border-border"
            >
              <Icon name="X" size={16} className="mr-2" />
              Сбросить фильтр
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Показано записей: {logs.length}
        </p>
      </div>

      <Card className="bg-card border-border">
        <div className="divide-y divide-border">
          {logs.length === 0 ? (
            <div className="p-12 text-center">
              <Icon name="FileSearch" size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">Нет записей для отображения</p>
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="p-6 hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg ${categoryColors[log.category]} flex items-center justify-center flex-shrink-0`}>
                    <Icon name={categoryIcons[log.category]} size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h3 className="text-base font-semibold text-foreground mb-1">
                          {log.action}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {log.details}
                        </p>
                      </div>
                      <Badge className={categoryColors[log.category]}>
                        {categoryLabels[log.category]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Icon name="User" size={14} />
                        <span>{log.userEmail}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Icon name="Clock" size={14} />
                        <span>
                          {format(log.timestamp, 'dd MMM yyyy, HH:mm', { locale: ru })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default AuditLog;
