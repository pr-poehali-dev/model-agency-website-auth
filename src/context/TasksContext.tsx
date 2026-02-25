import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';

const TASKS_API_URL = 'https://functions.poehali.dev/7de9b994-871a-4c9d-9260-edcb005ce100';
const ACTIVE_INTERVAL = 60_000;
const HIDDEN_INTERVAL = 5 * 60_000;

export interface Task {
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
  commentCount?: number;
}

interface TasksContextValue {
  tasks: Task[];
  loading: boolean;
  refresh: () => void;
}

const TasksContext = createContext<TasksContextValue>({
  tasks: [],
  loading: true,
  refresh: () => {},
});

export const useTasksContext = () => useContext(TasksContext);

interface TasksProviderProps {
  userEmail: string;
  userRole: string;
  children: ReactNode;
}

export const TasksProvider = ({ userEmail, userRole, children }: TasksProviderProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const emailRef = useRef(userEmail);
  const roleRef = useRef(userRole);
  emailRef.current = userEmail;
  roleRef.current = userRole;

  const fetchTasks = useCallback(async () => {
    const email = emailRef.current;
    const role = roleRef.current;
    if (!email || !role) return;
    try {
      const token = localStorage.getItem('authToken');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-User-Email': email,
        'X-User-Role': role,
      };
      if (token) headers['X-Auth-Token'] = token;
      const res = await fetch(TASKS_API_URL, { headers });
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error('TasksContext: fetch failed', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userEmail || !userRole) return;

    fetchTasks();

    let intervalId = setInterval(fetchTasks, document.hidden ? HIDDEN_INTERVAL : ACTIVE_INTERVAL);

    const onVisibilityChange = () => {
      clearInterval(intervalId);
      if (!document.hidden) fetchTasks();
      intervalId = setInterval(fetchTasks, document.hidden ? HIDDEN_INTERVAL : ACTIVE_INTERVAL);
    };

    const onTaskChanged = () => { setTimeout(fetchTasks, 800); };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('task-changed', onTaskChanged);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('task-changed', onTaskChanged);
    };
  }, [userEmail, userRole, fetchTasks]);

  return (
    <TasksContext.Provider value={{ tasks, loading, refresh: fetchTasks }}>
      {children}
    </TasksContext.Provider>
  );
};
