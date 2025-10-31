import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PERMISSIONS, type UserRole } from '@/lib/permissions';
import { addAuditLog } from '@/lib/auditLog';
import { useTheme } from '@/hooks/useTheme';
import DashboardNavigation from '@/components/dashboard/DashboardNavigation';
import ModelsTab from '@/components/dashboard/ModelsTab';
import ChecksTab from '@/components/dashboard/ChecksTab';
import DashboardTab from '@/components/dashboard/DashboardTab';
import FilesTab from '@/components/dashboard/FilesTab';
import UserManagement from './UserManagement';
import AuditLog from './AuditLog';
import ModelAssignmentManager from '@/components/ModelAssignmentManager';
import ProducerAssignmentManager from '@/components/ProducerAssignmentManager';
import FinancesTab from '@/components/FinancesTab';
import ScheduleTab from '@/components/ScheduleTab';
import ModelFinances from '@/components/ModelFinances';

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

const transactions = [
  { id: 1, date: '2025-10-25', model: 'Anastasia Ivanova', project: 'Vogue Editorial', amount: 45000, status: 'Paid' },
  { id: 2, date: '2025-10-23', model: 'Ekaterina Sokolova', project: 'Fashion Week Runway', amount: 85000, status: 'Paid' },
  { id: 3, date: '2025-10-20', model: 'Maria Petrova', project: 'Commercial Campaign', amount: 32000, status: 'Pending' },
  { id: 4, date: '2025-10-18', model: 'Victoria Romanova', project: 'Brand Ambassador', amount: 120000, status: 'Paid' },
  { id: 5, date: '2025-10-15', model: 'Anastasia Ivanova', project: 'Magazine Cover', amount: 55000, status: 'Paid' },
];

const monthlyRevenue = [
  { month: 'Apr', revenue: 280000, bookings: 18 },
  { month: 'May', revenue: 320000, bookings: 22 },
  { month: 'Jun', revenue: 295000, bookings: 19 },
  { month: 'Jul', revenue: 380000, bookings: 26 },
  { month: 'Aug', revenue: 420000, bookings: 28 },
  { month: 'Sep', revenue: 365000, bookings: 24 },
  { month: 'Oct', revenue: 337000, bookings: 21 },
];

const modelPerformance = [
  { name: 'Anastasia', earnings: 125000 },
  { name: 'Ekaterina', earnings: 185000 },
  { name: 'Maria', earnings: 98000 },
  { name: 'Victoria', earnings: 245000 },
];

const API_URL = 'https://functions.poehali.dev/67fd6902-6170-487e-bb46-f6d14ec99066';
const ASSIGNMENTS_API_URL = 'https://functions.poehali.dev/b7d8dd69-ab09-460d-999b-c0a1002ced30';
const PRODUCER_API_URL = 'https://functions.poehali.dev/a480fde5-8cc8-42e8-a535-626e393f6fa6';
const MODELS_API_URL = 'https://functions.poehali.dev/41dffced-c9d4-4e85-b52f-b5462be730e2';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [operatorAssignments, setOperatorAssignments] = useState<number[]>([]);
  const [producerAssignments, setProducerAssignments] = useState<number[]>([]);
  const [assignedProducer, setAssignedProducer] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [modelsData, setModelsData] = useState(models);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const email = localStorage.getItem('userEmail') || '';
    setUserEmail(email);
    if (email) {
      loadUserPermissions(email);
    }
    loadModels();
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
        image: 'https://cdn.poehali.dev/files/a384a4f2-a902-4860-919c-6bca8195c320.png',
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

  const loadUserPermissions = async (email: string) => {
    try {
      const response = await fetch(API_URL, { method: 'GET' });
      const users = await response.json();
      const currentUser = users.find((u: any) => u.email === email);
      if (currentUser) {
        setUserRole(currentUser.role);
        setUserName(currentUser.fullName || '');
        setUserPermissions(currentUser.permissions || []);
        
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
    const tabLabels: Record<string, string> = {
      home: 'Главная',
      models: 'Модели',
      finances: 'Финансы',
      checks: 'Чеки',
      schedule: 'Расписание',
      dashboard: 'Dashboard',
      files: 'Файлы',
      users: 'Пользователи',
      audit: 'История действий'
    };
    const category = ['models', 'finances'].includes(tabId) ? tabId as any : 'system';
    addAuditLog(userEmail, `Просмотр раздела`, `Открыт раздел "${tabLabels[tabId] || tabId}"`, category);
  };

  const navigationItems = [
    { id: 'home', label: 'Главная', icon: 'Home', permission: PERMISSIONS.VIEW_HOME },
    { id: 'models', label: 'Модели', icon: 'Users', permission: PERMISSIONS.VIEW_MODELS },
    { id: 'finances', label: 'Финансы', icon: 'DollarSign', permission: PERMISSIONS.VIEW_FINANCES },
    { id: 'checks', label: 'Чеки', icon: 'Receipt', permission: PERMISSIONS.VIEW_CHECKS },
    { id: 'schedule', label: 'Расписание', icon: 'Calendar', permission: PERMISSIONS.VIEW_SCHEDULE },
    { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', permission: PERMISSIONS.VIEW_DASHBOARD },
    { id: 'files', label: 'Файлы', icon: 'Files', permission: PERMISSIONS.VIEW_FILES },
    { id: 'users', label: 'Пользователи', icon: 'UserCog', permission: PERMISSIONS.MANAGE_USERS },
    { id: 'assignments', label: 'Назначения', icon: 'GitBranch', permission: PERMISSIONS.MANAGE_ASSIGNMENTS },
    { id: 'producer-assignments', label: 'Продюсеры', icon: 'UserCheck', permission: PERMISSIONS.MANAGE_PRODUCERS },
    { id: 'audit', label: 'История действий', icon: 'FileText', permission: PERMISSIONS.VIEW_AUDIT },
  ];

  const handleViewModelFinances = (modelId: number, modelName: string) => {
    setSelectedModelId(modelId);
    setActiveTab('model-finances');
    addAuditLog(
      userEmail, 
      'Просмотр финансов модели',
      `Открыта страница финансов для модели: ${modelName}`,
      'finances'
    );
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
        return <FinancesTab transactions={transactions} monthlyRevenue={monthlyRevenue} modelPerformance={modelPerformance} />;
      case 'checks':
        return <ChecksTab />;
      case 'schedule':
        return <ScheduleTab />;
      case 'dashboard':
        return <DashboardTab monthlyRevenue={monthlyRevenue} onNavigate={(tab) => setActiveTab(tab)} />;
      case 'files':
        return <FilesTab />;
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
      case 'audit':
        return <AuditLog />;
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
    </div>
  );
};

export default Dashboard;