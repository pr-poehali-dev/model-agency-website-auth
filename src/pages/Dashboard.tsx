import { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { PERMISSIONS, type UserRole } from '@/lib/permissions';
import { useTheme } from '@/hooks/useTheme';
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';
import LoadingScreen from '@/components/LoadingScreen';

const ModelsTab = lazy(() => import('@/components/dashboard/ModelsTab'));
const ChecksTab = lazy(() => import('@/components/dashboard/ChecksTab'));
const DashboardTab = lazy(() => import('@/components/dashboard/DashboardTab'));
const UserManagement = lazy(() => import('./UserManagement'));
const ModelAssignmentManager = lazy(() => import('@/components/ModelAssignmentManager'));
const ProducerAssignmentManager = lazy(() => import('@/components/ProducerAssignmentManager'));
const FinancesTab = lazy(() => import('@/components/FinancesTab'));
const ScheduleTab = lazy(() => import('@/components/ScheduleTab'));
const ModelFinances = lazy(() => import('@/components/ModelFinances'));
const CalculationTab = lazy(() => import('@/components/CalculationTab'));

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

const API_URL = 'https://functions.poehali.dev/67fd6902-6170-487e-bb46-f6d14ec99066';
const ASSIGNMENTS_API_URL = 'https://functions.poehali.dev/b7d8dd69-ab09-460d-999b-c0a1002ced30';
const PRODUCER_API_URL = 'https://functions.poehali.dev/a480fde5-8cc8-42e8-a535-626e393f6fa6';
const STATISTICS_API_URL = 'https://functions.poehali.dev/a154a7bf-592e-48d3-b0ce-6724de856af0';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [userPhotoUrl, setUserPhotoUrl] = useState('');
  const [operatorAssignments, setOperatorAssignments] = useState<number[]>([]);
  const [producerAssignments, setProducerAssignments] = useState<number[]>([]);
  const [assignedProducer, setAssignedProducer] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [modelsData, setModelsData] = useState(models);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([]);
  const [modelPerformance, setModelPerformance] = useState<any[]>([]);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const email = localStorage.getItem('userEmail') || '';
    setUserEmail(email);
    if (email) {
      loadUserPermissions(email);
    }
    loadModels();
    loadStatistics();
  }, []);

  const loadModels = async () => {
    try {
      const response = await fetch(API_URL);
      const users = await response.json();
      const contentMakers = users.filter((u: any) => u.role === 'content_maker');
      
      const modelsFromUsers = contentMakers.map((user: any) => ({
        id: user.id,
        email: user.email,
        name: user.fullName || user.email,
        image: user.photoUrl || 'https://cdn.poehali.dev/files/a384a4f2-a902-4860-919c-6bca8195c320.png',
        height: '170 cm',
        bust: '85 cm',
        waist: '60 cm',
        hips: '90 cm',
        experience: 'Новичок',
        specialty: 'Content Maker',
        status: 'Available'
      }));
      
      if (modelsFromUsers.length > 0) {
        setModelsData(modelsFromUsers);
      }
    } catch (err) {
      console.error('Failed to load models', err);
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

  const loadUserPermissions = async (email: string) => {
    try {
      const response = await fetch(API_URL, { method: 'GET' });
      const users = await response.json();
      const currentUser = users.find((u: any) => u.email === email);
      if (currentUser) {
        setUserRole(currentUser.role);
        setUserName(currentUser.fullName || '');
        setUserPermissions(currentUser.permissions || []);
        setUserPhotoUrl(currentUser.photoUrl || '');
        
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
    } catch (err) {
      console.error('Failed to load user permissions', err);
    }
  };

  const loadOperatorAssignments = async (email: string) => {
    try {
      const response = await fetch(`${ASSIGNMENTS_API_URL}?operator=${encodeURIComponent(email)}`);
      const assignments = await response.json();
      const modelIds = assignments.map((a: any) => a.modelId);
      setOperatorAssignments(modelIds);
    } catch (err) {
      console.error('Failed to load operator assignments', err);
    }
  };

  const loadProducerAssignments = async (email: string) => {
    try {
      const response = await fetch(`${PRODUCER_API_URL}?producer=${encodeURIComponent(email)}&type=model`);
      const assignments = await response.json();
      const modelEmails = assignments.map((a: any) => a.modelEmail);
      setProducerAssignments(modelEmails);
    } catch (err) {
      console.error('Failed to load producer assignments', err);
    }
  };

  const loadAssignedProducer = async (operatorEmail: string) => {
    try {
      const response = await fetch(`${PRODUCER_API_URL}?type=operator`);
      const assignments = await response.json();
      const assignment = assignments.find((a: any) => a.operatorEmail === operatorEmail);
      if (assignment) {
        const usersResponse = await fetch(API_URL, { method: 'GET' });
        const users = await usersResponse.json();
        const producer = users.find((u: any) => u.email === assignment.producerEmail);
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

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const navigationItems = [
    { id: 'home', label: 'Главная', icon: 'Home', permission: PERMISSIONS.VIEW_HOME },
    { id: 'models', label: 'Модели', icon: 'Users', permission: PERMISSIONS.VIEW_MODELS },
    { id: 'finances', label: 'Финансы', icon: 'DollarSign', permission: PERMISSIONS.VIEW_FINANCES },
    { id: 'checks', label: 'Чеки', icon: 'Receipt', permission: PERMISSIONS.VIEW_CHECKS },
    { id: 'calculation', label: 'Подсчёт', icon: 'Calculator', permission: PERMISSIONS.MANAGE_USERS },
    { id: 'schedule', label: 'Расписание', icon: 'Calendar', permission: PERMISSIONS.VIEW_SCHEDULE },

    { id: 'users', label: 'Пользователи', icon: 'UserCog', permission: PERMISSIONS.MANAGE_USERS },
    { id: 'assignments', label: 'Назначения', icon: 'GitBranch', permission: PERMISSIONS.MANAGE_ASSIGNMENTS },
    { id: 'producer-assignments', label: 'Продюсеры', icon: 'UserCheck', permission: PERMISSIONS.MANAGE_PRODUCERS },

  ];

  const handleViewModelFinances = (modelId: number, modelName: string) => {
    setSelectedModelId(modelId);
    setActiveTab('model-finances');
  };

  const renderTabContent = () => {
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
        return <DashboardTab onNavigate={(tab) => setActiveTab(tab)} onViewFinances={handleViewModelFinances} />;
      case 'models':
        return <ModelsTab 
          models={modelsData} 
          operatorAssignments={operatorAssignments}
          producerAssignments={producerAssignments}
          assignedProducer={assignedProducer}
          onViewFinances={handleViewModelFinances}
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
      case 'calculation':
        return <CalculationTab />;
      case 'schedule':
        return <ScheduleTab userRole={userRole || undefined} userPermissions={userPermissions} />;

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

      default:
        return <DashboardHome 
          models={models} 
          transactions={transactions} 
          monthlyRevenue={monthlyRevenue} 
          modelPerformance={modelPerformance}
        />;
    }
  };

  return (
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
          <Suspense fallback={<LoadingScreen />}>
            {renderTabContent()}
          </Suspense>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;