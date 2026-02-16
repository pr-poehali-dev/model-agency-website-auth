import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import type { UserRole } from '@/lib/permissions';

const TASKS_API_URL = 'https://functions.poehali.dev/7de9b994-871a-4c9d-9260-edcb005ce100';

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignedToEmail: string;
  assignedByEmail: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  assignedToName: string | null;
  assignedByName: string | null;
}

interface Assignee {
  email: string;
  fullName: string;
  role: string;
}

interface TasksTabProps {
  userRole?: UserRole;
  userEmail: string;
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: 'Низкий', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  medium: { label: 'Средний', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  high: { label: 'Высокий', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
  urgent: { label: 'Срочный', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: 'Ожидает', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300', icon: 'Clock' },
  in_progress: { label: 'В работе', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300', icon: 'Play' },
  completed: { label: 'Выполнена', color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300', icon: 'Check' },
  cancelled: { label: 'Отменена', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', icon: 'X' },
};

const ROLE_LABELS: Record<string, string> = {
  producer: 'Продюсер',
  operator: 'Оператор',
};

const TasksTab = ({ userRole, userEmail }: TasksTabProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', assignedToEmail: '', dueDate: '' });
  const { toast } = useToast();

  const canCreate = userRole === 'director' || userRole === 'producer';

  const getHeaders = () => {
    const token = localStorage.getItem('authToken');
    const h: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-User-Email': userEmail,
      'X-User-Role': userRole || '',
    };
    if (token) h['X-Auth-Token'] = token;
    return h;
  };

  const loadTasks = useCallback(async () => {
    try {
      const res = await fetch(TASKS_API_URL, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error('Failed to load tasks', err);
    } finally {
      setLoading(false);
    }
  }, [userEmail, userRole]);

  const loadAssignees = useCallback(async () => {
    if (!canCreate) return;
    try {
      const res = await fetch(`${TASKS_API_URL}?action=assignees`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAssignees(data);
      }
    } catch (err) {
      console.error('Failed to load assignees', err);
    }
  }, [userEmail, userRole, canCreate]);

  useEffect(() => { loadTasks(); loadAssignees(); }, [loadTasks, loadAssignees]);

  const handleCreate = async () => {
    if (!newTask.title.trim() || !newTask.assignedToEmail) {
      toast({ title: 'Заполните название и исполнителя', variant: 'destructive' });
      return;
    }
    setCreateLoading(true);
    try {
      const res = await fetch(TASKS_API_URL, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          title: newTask.title,
          description: newTask.description,
          priority: newTask.priority,
          assignedToEmail: newTask.assignedToEmail,
          dueDate: newTask.dueDate || null,
        }),
      });
      if (res.ok) {
        toast({ title: 'Задача создана' });
        setIsCreateOpen(false);
        setNewTask({ title: '', description: '', priority: 'medium', assignedToEmail: '', dueDate: '' });
        loadTasks();
      } else {
        const err = await res.json();
        toast({ title: err.error || 'Ошибка', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Ошибка сети', variant: 'destructive' });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    try {
      const res = await fetch(TASKS_API_URL, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ id: taskId, status: newStatus }),
      });
      if (res.ok) {
        loadTasks();
      }
    } catch {
      toast({ title: 'Ошибка обновления', variant: 'destructive' });
    }
  };

  const handleDelete = async (taskId: number) => {
    try {
      const res = await fetch(TASKS_API_URL, {
        method: 'DELETE',
        headers: getHeaders(),
        body: JSON.stringify({ id: taskId }),
      });
      if (res.ok) {
        toast({ title: 'Задача удалена' });
        loadTasks();
      } else {
        const err = await res.json();
        toast({ title: err.error || 'Ошибка', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Ошибка сети', variant: 'destructive' });
    }
  };

  const filtered = filterStatus === 'all' ? tasks : tasks.filter(t => t.status === filterStatus);

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const isOverdue = (task: Task) => {
    if (!task.dueDate || task.status === 'completed' || task.status === 'cancelled') return false;
    return new Date(task.dueDate) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icon name="Loader2" className="animate-spin text-muted-foreground" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Задачи</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {userRole === 'director' ? 'Все задачи команды' : userRole === 'producer' ? 'Задачи ваших операторов' : 'Ваши задачи'}
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setIsCreateOpen(true)}>
            <Icon name="Plus" size={18} className="mr-2" />
            Новая задача
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setFilterStatus('all')}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Всего</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-yellow-500/50 transition-colors" onClick={() => setFilterStatus('pending')}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Ожидают</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-blue-500/50 transition-colors" onClick={() => setFilterStatus('in_progress')}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
            <p className="text-xs text-muted-foreground">В работе</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:border-green-500/50 transition-colors" onClick={() => setFilterStatus('completed')}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            <p className="text-xs text-muted-foreground">Выполнены</p>
          </CardContent>
        </Card>
      </div>

      {filterStatus !== 'all' && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{STATUS_CONFIG[filterStatus]?.label || filterStatus}</Badge>
          <Button variant="ghost" size="sm" onClick={() => setFilterStatus('all')}>
            <Icon name="X" size={14} className="mr-1" /> Сбросить
          </Button>
        </div>
      )}

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Icon name="ClipboardList" size={48} className="mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              {tasks.length === 0 ? 'Задач пока нет' : 'Нет задач с таким статусом'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(task => (
            <Card key={task.id} className={`transition-all hover:shadow-md ${isOverdue(task) ? 'border-red-300 dark:border-red-800' : ''}`}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className={`font-semibold ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </h3>
                      <Badge className={PRIORITY_CONFIG[task.priority]?.color || ''} variant="secondary">
                        {PRIORITY_CONFIG[task.priority]?.label || task.priority}
                      </Badge>
                      <Badge className={STATUS_CONFIG[task.status]?.color || ''} variant="secondary">
                        <Icon name={STATUS_CONFIG[task.status]?.icon || 'Circle'} size={12} className="mr-1" />
                        {STATUS_CONFIG[task.status]?.label || task.status}
                      </Badge>
                      {isOverdue(task) && (
                        <Badge variant="destructive" className="text-xs">Просрочена</Badge>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Icon name="User" size={12} />
                        {task.assignedToName || task.assignedToEmail}
                      </span>
                      <span className="flex items-center gap-1">
                        <Icon name="UserCheck" size={12} />
                        от {task.assignedByName || task.assignedByEmail}
                      </span>
                      {task.dueDate && (
                        <span className={`flex items-center gap-1 ${isOverdue(task) ? 'text-red-500 font-medium' : ''}`}>
                          <Icon name="Calendar" size={12} />
                          до {formatDate(task.dueDate)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Icon name="Clock" size={12} />
                        {formatDate(task.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {task.status === 'pending' && (
                      <Button variant="ghost" size="sm" onClick={() => handleStatusChange(task.id, 'in_progress')} title="Начать">
                        <Icon name="Play" size={16} />
                      </Button>
                    )}
                    {task.status === 'in_progress' && (
                      <Button variant="ghost" size="sm" onClick={() => handleStatusChange(task.id, 'completed')} title="Завершить">
                        <Icon name="Check" size={16} className="text-green-600" />
                      </Button>
                    )}
                    {task.status === 'completed' && (
                      <Button variant="ghost" size="sm" onClick={() => handleStatusChange(task.id, 'pending')} title="Вернуть">
                        <Icon name="RotateCcw" size={16} />
                      </Button>
                    )}
                    {canCreate && task.assignedByEmail === userEmail && (
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(task.id)} title="Удалить">
                        <Icon name="Trash2" size={16} className="text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Новая задача</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Название *</Label>
              <Input
                value={newTask.title}
                onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))}
                placeholder="Что нужно сделать?"
              />
            </div>
            <div>
              <Label>Описание</Label>
              <Textarea
                value={newTask.description}
                onChange={e => setNewTask(p => ({ ...p, description: e.target.value }))}
                placeholder="Подробности..."
                rows={3}
              />
            </div>
            <div>
              <Label>Исполнитель *</Label>
              <Select value={newTask.assignedToEmail} onValueChange={v => setNewTask(p => ({ ...p, assignedToEmail: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите сотрудника" />
                </SelectTrigger>
                <SelectContent>
                  {assignees.map(a => (
                    <SelectItem key={a.email} value={a.email}>
                      {a.fullName || a.email} ({ROLE_LABELS[a.role] || a.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Приоритет</Label>
                <Select value={newTask.priority} onValueChange={v => setNewTask(p => ({ ...p, priority: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Низкий</SelectItem>
                    <SelectItem value="medium">Средний</SelectItem>
                    <SelectItem value="high">Высокий</SelectItem>
                    <SelectItem value="urgent">Срочный</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Дедлайн</Label>
                <Input
                  type="date"
                  value={newTask.dueDate}
                  onChange={e => setNewTask(p => ({ ...p, dueDate: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Отмена</Button>
            <Button onClick={handleCreate} disabled={createLoading}>
              {createLoading ? <Icon name="Loader2" size={16} className="animate-spin mr-2" /> : null}
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TasksTab;
