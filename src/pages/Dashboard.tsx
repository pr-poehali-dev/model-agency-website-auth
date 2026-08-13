import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PERMISSIONS, ROLE_PERMISSIONS, type UserRole } from '@/lib/permissions';
import { getAuthHeaders } from '@/lib/api';
import { API_URLS } from '@/lib/apiUrls';
import { useTheme } from '@/hooks/useTheme';
import { useIdleTimeout } from '@/hooks/useIdleTimeout';
import IdleWarningDialog from '@/components/IdleWarningDialog';
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';
import ModelsTab from '@/components/dashboard/ModelsTab';
import ChecksTab from '@/components/dashboard/ChecksTab';
import DashboardTab from '@/components/dashboard/DashboardTab';
import DashboardHome from '@/components/dashboard/DashboardHome';
import UserManagement from './UserManagement';
import ModelAssignmentManager from '@/components/ModelAssignmentManager';
import LoginHistoryTab from '@/components/LoginHistoryTab';
import ActiveSessionsTab from '@/components/ActiveSessionsTab';
import ProducerAssignmentManager from '@/components/ProducerAssignmentManager';
import FinancesTab from '@/components/FinancesTab';
import ScheduleTab from '@/components/ScheduleTab';
import CleaningSchedule from '@/components/CleaningSchedule';
import useCleaningNotifications from '@/hooks/useCleaningNotifications';
import ModelFinances from '@/components/ModelFinances';
import PairFinances from '@/components/PairFinances';
import SettingsTab from '@/components/SettingsTab';
import TasksTab from '@/components/TasksTab';
import { TasksProvider } from '@/context/TasksContext';

const models = [
  {
    id: 1,
    name: 'Anastasia Ivanova',
    image: 'https://cdn.poehali.dev/files/a384a4f2-a902-4860-919c-6bca8195c320.png',
    height: '178 cm',
    bust: '86 cm',
    waist: '61 cm',
    hips: '89 cm',
    experience: '5+ years',
    specialty: 'Fashion & Editorial',
    status: 'Available'
  },
  {
    id: 2,
    name: 'Ekaterina Sokolova',
    image: 'https://cdn.poehali.dev/files/a384a4f2-a902-4860-919c-6bca8195c320.png',
    height: '180 cm',
    bust: '84 cm',
    waist: '59 cm',
    hips: '88 cm',
    experience: '7+ years',
    specialty: 'Runway & Commercial',
    status: 'Booked'
  },
  {
    id: 3,
    name: 'Maria Petrova',
    image: 'https://cdn.poehali.dev/files/a384a4f2-a902-4860-919c-6bca8195c320.png',
    height: '175 cm',
    bust: '85 cm',
    waist: '60 cm',
    hips: '90 cm',
    experience: '3+ years',
    specialty: 'Beauty & Lifestyle',
    status: 'Available'
  },
  {
    id: 4,
    name: 'Victoria Romanova',
    image: 'https://cdn.poehali.dev/files/a384a4f2-a902-4860-919c-6bca8195c320.png',
    height: '182 cm',
    bust: '87 cm',
    waist: '62 cm',
    hips: '91 cm',
    experience: '6+ years',
    specialty: 'High Fashion',
    status: 'Available'
  }
];

const API_URL = API_URLS.auth;
const ASSIGNMENTS_API_URL = API_URLS.operatorAssignments;
const PRODUCER_API_URL = API_URLS.producerAssignments;
const STATISTICS_API_URL = API_URLS.statistics;

interface ApiUser {
  id: number;
  email: string;
  role: string;
  fullName?: string;
  photoUrl?: string;
  permissions?: string[];
}

interface OperatorAssignment {
  modelId: number;
}

interface ProducerAssignment {
  modelEmail: string;
  operatorEmail?: string;
  producerEmail?: string;
}

type StatRow = Record<string, unknown>;

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const [selectedPair, setSelectedPair] = useState<{ m1Id: number; m1Name: string; m2Id: number; m2Name: string } | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [userPhotoUrl, setUserPhotoUrl] = useState(() => localStorage.getItem('userPhotoUrl') || '');
  const [operatorAssignments, setOperatorAssignments] = useState<number[]>([]);
  const [producerAssignments, setProducerAssignments] = useState<number[]>([]);
  const [assignedProducer, setAssignedProducer] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [modelsData, setModelsData] = useState(models);
  const [transactions, setTransactions] = useState<StatRow[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<StatRow[]>([]);
  const [modelPerformance, setModelPerformance] = useState<StatRow[]>([]);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  useCleaningNotifications(userEmail, userRole);

  useEffect(() => {
    const email = localStorage.getItem('userEmail') || '';
    setUserEmail(email);
    loadUsersAndPermissions(email);
    loadStatistics();
  }, []);

  const loadUsersAndPermissions = async (email: string) => {
    try {
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        console.error('Failed to load users: HTTP', response.status);
        return;
      }

      const users = await response.json();

      if (!Array.isArray(users)) {
        console.error('Invalid response format:', users);
        return;
      }

      const contentMakers = users.filter((u: ApiUser) => u.role === 'content_maker' || u.role === 'solo_maker');
      const modelsFromUsers = contentMakers.map((user: ApiUser) => ({
        id: user.id,
        email: user.email,
        name: user.fullName || user.email,
        image: user.photoUrl || 'https://cdn.poehali.dev/files/a384a4f2-a902-4860-919c-6bca8195c320.png',
        height: '170 cm',
        bust: '85 cm',
        waist: '60 cm',
        hips: '90 cm',
        experience: 'Новичок',
        specialty: user.role === 'solo_maker' ? 'Соло-модель' : 'Content Maker',
        status: 'Available'
      }));
      if (modelsFromUsers.length > 0) {
        setModelsData(modelsFromUsers);
      }

      if (email) {
        const currentUser = users.find((u: ApiUser) => u.email === email);
        if (currentUser) {
          setUserRole(currentUser.role);
          setUserName(currentUser.fullName || '');

          const dbPermissions = currentUser.permissions || [];
          const rolePermissions = ROLE_PERMISSIONS[currentUser.role as UserRole] || [];
          const effectivePermissions = dbPermissions.length > 0 ? dbPermissions : rolePermissions;

          setUserPermissions(effectivePermissions);
          const freshPhotoUrl = currentUser.photoUrl || '';
          setUserPhotoUrl(freshPhotoUrl);
          if (freshPhotoUrl) {
            localStorage.setItem('userPhotoUrl', freshPhotoUrl);
          } else {
            localStorage.removeItem('userPhotoUrl');
          }

          if (currentUser.role === 'operator') {
            loadOperatorAssignments(email);
            loadAssignedProducer(email);
          }
          if (currentUser.role === 'producer') {
            loadProducerAssignments(email);
            setActiveTab('checks');
          }
          if (currentUser.role === 'content_maker') {
            setActiveTab('schedule');
          }
        }
      }
    } catch (err) {
      console.error('Failed to load users', err);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await fetch(STATISTICS_API_URL);
      const data = await response.json();
      setTransactions(data.transactions || []);
      setMonthlyRevenue(data.monthlyRevenue || []);
      setModelPerformance(data.modelPerformance || []);
    } catch (err) {
      console.error('Failed to load statistics', err);
    }
  };

  const loadOperatorAssignments = async (email: string) => {
    try {
      const response = await fetch(`${ASSIGNMENTS_API_URL}?operator=${encodeURIComponent(email)}`);
      const assignments = await response.json();
      const modelIds = assignments.map((a: OperatorAssignment) => a.modelId);
      setOperatorAssignments(modelIds);
    } catch (err) {
      console.error('Failed to load operator assignments', err);
    }
  };

  const loadProducerAssignments = async (email: string) => {
    try {
      const response = await fetch(`${PRODUCER_API_URL}?producer=${encodeURIComponent(email)}&type=model`);
      const assignments = await response.json();
      const modelEmails = assignments.map((a: ProducerAssignment) => a.modelEmail);
      setProducerAssignments(modelEmails);
    } catch (err) {
      console.error('Failed to load producer assignments', err);
    }
  };

  const loadAssignedProducer = async (operatorEmail: string) => {
    try {
      const response = await fetch(`${PRODUCER_API_URL}?type=operator`);
      const assignments = await response.json();
      const assignment = assignments.find((a: ProducerAssignment) => a.operatorEmail === operatorEmail);
      if (assignment) {
        const usersResponse = await fetch(API_URL, {
          method: 'GET',
          headers: getAuthHeaders(),
          credentials: 'include'
        });
        const users = await usersResponse.json();
        const producer = users.find((u: ApiUser) => u.email === assignment.producerEmail);
        setAssignedProducer(producer?.fullName || assignment.producerEmail);
      }
    } catch (err) {
      console.error('Failed to load assigned producer', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userEmail');
    navigate('/');
  };

  const handleIdleLogout = useCallback(() => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('authToken');
    navigate('/?reason=idle');
  }, [navigate]);

  const { isWarning, secondsLeft, reset: resetIdle } = useIdleTimeout({
    timeoutMs: 10 * 60 * 1000,
    warningMs: 60 * 1000,
    onTimeout: handleIdleLogout,
  });

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const navigationItems = [
    { id: 'home', label: 'Главная', icon: 'Home', permission: PERMISSIONS.VIEW_HOME },
    { id: 'models', label: 'Модели', icon: 'Users', permission: PERMISSIONS.VIEW_MODELS },
    { id: 'finances', label: 'Финансы', icon: 'DollarSign', permission: PERMISSIONS.VIEW_FINANCES },
    { id: 'checks', label: 'Чеки', icon: 'Receipt', permission: PERMISSIONS.VIEW_CHECKS },
    { id: 'schedule', label: 'Расписание', icon: 'Calendar', permission: PERMISSIONS.VIEW_SCHEDULE },
    { id: 'tasks', label: 'Задачи', icon: 'ClipboardList', permission: PERMISSIONS.VIEW_TASKS },
    { id: 'settings', label: 'Настройки', icon: 'Settings', permission: PERMISSIONS.MANAGE_USERS },

    { id: 'users', label: 'Пользователи', icon: 'UserCog', permission: PERMISSIONS.MANAGE_USERS },
    { id: 'assignments', label: 'Назначения', icon: 'GitBranch', permission: PERMISSIONS.MANAGE_ASSIGNMENTS },
    { id: 'producer-assignments', label: 'Продюсеры', icon: 'UserCheck', permission: PERMISSIONS.MANAGE_PRODUCERS },
    { id: 'login-history', label: 'История входов', icon: 'History', permission: PERMISSIONS.VIEW_AUDIT },
    { id: 'active-sessions', label: 'Активные сессии', icon: 'MonitorSmartphone', permission: PERMISSIONS.VIEW_AUDIT },

  ];

  const handleViewModelFinances = (modelId: number, modelName: string) => {
    setSelectedModelId(modelId);
    setSelectedPair(null);
    setActiveTab('model-finances');
  };

  const handleViewPairFinances = (m1Id: number, m1Name: string, m2Id: number, m2Name: string) => {
    setSelectedPair({ m1Id, m1Name, m2Id, m2Name });
    setSelectedModelId(null);
    setActiveTab('model-finances');
  };

  const renderTabContent = () => {
    if (activeTab === 'model-finances' && selectedPair) {
      return (
        <PairFinances
          model1Id={selectedPair.m1Id}
          model1Name={selectedPair.m1Name}
          model2Id={selectedPair.m2Id}
          model2Name={selectedPair.m2Name}
          currentUserEmail={userEmail}
          userRole={userRole || undefined}
          onBack={() => setActiveTab('models')}
        />
      );
    }

    if (activeTab === 'model-finances' && selectedModelId) {
      const model = modelsData.find(m => m.id === selectedModelId);
      return (
        <ModelFinances 
          modelId={selectedModelId} 
          modelName={model?.name || ''} 
          currentUserEmail={userEmail}
          userRole={userRole || undefined}
          onBack={() => setActiveTab('models')}
        />
      );
    }

    switch (activeTab) {
      case 'home':
        return <DashboardHome 
          models={modelsData}
          userRole={userRole}
          userEmail={userEmail}
          onNavigate={handleTabChange}
        />;
      case 'models':
        return <ModelsTab 
          models={modelsData} 
          operatorAssignments={operatorAssignments}
          producerAssignments={producerAssignments}
          assignedProducer={assignedProducer}
          onViewFinances={handleViewModelFinances}
          onViewPairFinances={handleViewPairFinances}
          userRole={userRole || undefined}
        />;
      case 'finances':
        return <FinancesTab 
          transactions={transactions} 
          monthlyRevenue={monthlyRevenue} 
          modelPerformance={modelPerformance}
          userEmail={userEmail}
          userRole={userRole || undefined}
        />;
      case 'checks':
        return <ChecksTab />;
      case 'schedule':
        return <ScheduleTab
          userRole={userRole || undefined}
          userPermissions={userPermissions}
          onOpenCleaning={() => setActiveTab('cleaning-schedule')}
        />;
      case 'cleaning-schedule':
        return <CleaningSchedule
          userRole={userRole || undefined}
          userEmail={userEmail}
          onBack={() => setActiveTab('schedule')}
        />;
      case 'tasks':
        return <TasksTab userRole={userRole || undefined} userEmail={userEmail} />;
      case 'settings':
        return <SettingsTab userEmail={userEmail} userRole={userRole || undefined} />;

      case 'users':
        return <UserManagement />;
      case 'assignments':
        return <ModelAssignmentManager 
          currentUserEmail={userEmail} 
          currentUserRole={userRole || 'operator'}
          onAssignmentChanged={() => {
            if (userRole === 'operator') {
              loadOperatorAssignments(userEmail);
            }
          }}
        />;
      case 'producer-assignments':
        return <ProducerAssignmentManager currentUserEmail={userEmail} currentUserRole={userRole || 'director'} />;
      case 'login-history':
        return <LoginHistoryTab />;
      case 'active-sessions':
        return <ActiveSessionsTab />;

      default:
        return <DashboardHome 
          models={modelsData}
          userRole={userRole}
          userEmail={userEmail}
          onNavigate={handleTabChange}
        />;
    }
  };

  return (
    <TasksProvider userEmail={userEmail} userRole={userRole || ''}>
    <div className="min-h-screen bg-background">
      <DashboardNavigation
        activeTab={activeTab}
        navigationItems={navigationItems}
        userPermissions={userPermissions}
        userEmail={userEmail}
        userName={userName}
        userRole={userRole}
        userPhotoUrl={userPhotoUrl}
        theme={theme}
        mobileMenuOpen={mobileMenuOpen}
        onTabChange={handleTabChange}
        onToggleTheme={toggleTheme}
        onLogout={handleLogout}
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
      />

      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-6 lg:p-8 animate-fade-in">
          {renderTabContent()}
        </div>
      </main>

      <IdleWarningDialog
        open={isWarning}
        secondsLeft={secondsLeft}
        onStay={resetIdle}
        onLogout={handleIdleLogout}
      />
    </div>
    </TasksProvider>
  );
};

export default Dashboard;