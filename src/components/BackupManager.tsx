import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import { authenticatedFetch } from '@/lib/api';

interface Backup {
  id: number;
  name: string;
  createdAt: string;
  tablesCount: number;
  description: string;
}

const BACKUP_API_URL = 'https://functions.poehali.dev/ff41952f-c731-4493-832d-3aa161fa786f';

const BackupManager = () => {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [description, setDescription] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch(BACKUP_API_URL);
      const data = await response.json();
      setBackups(data);
    } catch (err) {
      console.error('Failed to load backups', err);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить список бэкапов',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch(BACKUP_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          description: description || 'Ручной бэкап'
        })
      });

      const result = await response.json();
      
      toast({
        title: 'Успешно',
        description: 'Точка отката создана'
      });

      setIsCreateDialogOpen(false);
      setDescription('');
      loadBackups();
    } catch (err) {
      console.error('Failed to create backup', err);
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать точку отката',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!selectedBackup) return;

    setLoading(true);
    try {
      const response = await authenticatedFetch(BACKUP_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'restore',
          backupId: selectedBackup.id
        })
      });

      const result = await response.json();
      
      toast({
        title: 'Успешно',
        description: 'Данные восстановлены из точки отката'
      });

      setIsRestoreDialogOpen(false);
      setSelectedBackup(null);
      
      // Перезагрузить страницу через 2 секунды
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      console.error('Failed to restore backup', err);
      toast({
        title: 'Ошибка',
        description: 'Не удалось восстановить данные',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Точки отката</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Создавайте точки отката перед важными изменениями
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} disabled={loading}>
          <Icon name="Plus" size={16} className="mr-2" />
          Создать точку отката
        </Button>
      </div>

      {loading && backups.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Icon name="Loader2" size={24} className="animate-spin" />
        </div>
      ) : backups.length === 0 ? (
        <Card className="p-12 text-center">
          <Icon name="Database" size={48} className="mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            Пока нет ни одной точки отката
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {backups.map((backup) => (
            <Card key={backup.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Icon name="Database" size={20} className="text-primary" />
                    <div>
                      <h3 className="font-semibold text-foreground">{backup.description}</h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span>{formatDate(backup.createdAt)}</span>
                        <span>•</span>
                        <span>{backup.tablesCount} таблиц</span>
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedBackup(backup);
                    setIsRestoreDialogOpen(true);
                  }}
                  disabled={loading}
                >
                  <Icon name="RotateCcw" size={16} className="mr-2" />
                  Откатить
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать точку отката</DialogTitle>
            <DialogDescription>
              Будет создана копия всех данных для возможности восстановления
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Описание (необязательно)
              </label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Например: Перед обновлением расписания"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={loading}
              >
                Отмена
              </Button>
              <Button onClick={handleCreateBackup} disabled={loading}>
                {loading ? (
                  <>
                    <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                    Создание...
                  </>
                ) : (
                  'Создать'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтверждение отката</DialogTitle>
            <DialogDescription>
              Все текущие данные будут заменены на данные из выбранной точки отката.
              Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedBackup && (
              <Card className="p-4 bg-muted/50">
                <div className="flex items-center gap-3">
                  <Icon name="Database" size={20} className="text-primary" />
                  <div>
                    <p className="font-semibold">{selectedBackup.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(selectedBackup.createdAt)}
                    </p>
                  </div>
                </div>
              </Card>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsRestoreDialogOpen(false)}
                disabled={loading}
              >
                Отмена
              </Button>
              <Button
                onClick={handleRestoreBackup}
                disabled={loading}
                variant="destructive"
              >
                {loading ? (
                  <>
                    <Icon name="Loader2" size={16} className="mr-2 animate-spin" />
                    Восстановление...
                  </>
                ) : (
                  <>
                    <Icon name="RotateCcw" size={16} className="mr-2" />
                    Откатить данные
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BackupManager;
