import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { hasPermission, PERMISSIONS, MOCK_USERS } from '@/lib/permissions';
import UserManagement from './UserManagement';
import AuditLog from './AuditLog';
import { addAuditLog } from '@/lib/auditLog';

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

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const email = localStorage.getItem('userEmail') || '';
    setUserEmail(email);
  }, []);

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
    { id: 'files', label: 'Файлы', icon: 'FolderOpen', permission: PERMISSIONS.VIEW_FILES },
    { id: 'users', label: 'Пользователи', icon: 'UserCog', permission: PERMISSIONS.MANAGE_USERS },
    { id: 'audit', label: 'История', icon: 'History', permission: PERMISSIONS.MANAGE_USERS }
  ];

  const visibleItems = navigationItems.filter(item => hasPermission(userEmail, item.permission));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">MBA Corp.</h1>
            <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">Professional Models Agency</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-foreground font-medium">{userEmail}</p>
              <p className="text-xs text-muted-foreground">{MOCK_USERS[userEmail]?.role || 'viewer'}</p>
            </div>
            <Button 
              onClick={handleLogout} 
              variant="outline" 
              className="border-border hover:bg-secondary"
            >
              <Icon name="LogOut" size={18} className="mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 min-h-screen bg-card border-r border-border">
          <nav className="p-4 space-y-2">
            {visibleItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeTab === item.id
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <Icon name={item.icon} size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-8">
          {activeTab === 'home' && (
            <div className="animate-fade-in">
              <h2 className="text-4xl font-serif font-bold mb-6 text-foreground">Welcome to MBA Corp.</h2>
              <p className="text-lg text-muted-foreground mb-8">Manage your elite model portfolio with precision and style.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 bg-card border-border hover:border-primary transition-all duration-300 cursor-pointer group">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Icon name="Users" size={24} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-foreground">{models.length}</p>
                      <p className="text-sm text-muted-foreground">Active Models</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-card border-border hover:border-primary transition-all duration-300 cursor-pointer group">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Icon name="Calendar" size={24} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-foreground">12</p>
                      <p className="text-sm text-muted-foreground">Bookings This Week</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-card border-border hover:border-primary transition-all duration-300 cursor-pointer group">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Icon name="TrendingUp" size={24} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-foreground">94%</p>
                      <p className="text-sm text-muted-foreground">Client Satisfaction</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'models' && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-4xl font-serif font-bold text-foreground mb-2">Our Models</h2>
                  <p className="text-muted-foreground">Elite talent portfolio</p>
                </div>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Icon name="Plus" size={18} className="mr-2" />
                  Add New Model
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {models.map((model) => (
                  <Card 
                    key={model.id} 
                    className="overflow-hidden bg-card border-border hover:shadow-2xl transition-all duration-300 group cursor-pointer hover:scale-[1.02]"
                  >
                    <div className="aspect-[3/4] bg-secondary relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent z-10"></div>
                      <Avatar className="w-full h-full rounded-none">
                        <AvatarImage src={model.image} className="object-cover" />
                        <AvatarFallback className="rounded-none">{model.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <Badge 
                        className={`absolute top-4 right-4 z-20 ${
                          model.status === 'Available' 
                            ? 'bg-green-500/90 hover:bg-green-500' 
                            : 'bg-orange-500/90 hover:bg-orange-500'
                        }`}
                      >
                        {model.status}
                      </Badge>
                    </div>
                    
                    <div className="p-5">
                      <h3 className="text-xl font-serif font-bold text-foreground mb-1">{model.name}</h3>
                      <p className="text-sm text-primary mb-4">{model.specialty}</p>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Height:</span>
                          <span className="text-foreground font-medium">{model.height}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Measurements:</span>
                          <span className="text-foreground font-medium">{model.bust} / {model.waist} / {model.hips}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Experience:</span>
                          <span className="text-foreground font-medium">{model.experience}</span>
                        </div>
                      </div>

                      <Button 
                        className="w-full mt-4 bg-secondary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                        variant="outline"
                      >
                        View Portfolio
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'finances' && (
            <div className="animate-fade-in">
              <div className="mb-8">
                <h2 className="text-4xl font-serif font-bold text-foreground mb-2">Финансы</h2>
                <p className="text-muted-foreground">Financial overview and transactions</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="p-6 bg-card border-border">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                      <Icon name="TrendingUp" size={20} className="text-green-500" />
                    </div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                  </div>
                  <p className="text-3xl font-bold text-foreground">₽337,000</p>
                  <p className="text-xs text-green-500 mt-1">+12.5% from last month</p>
                </Card>

                <Card className="p-6 bg-card border-border">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Icon name="Clock" size={20} className="text-blue-500" />
                    </div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                  </div>
                  <p className="text-3xl font-bold text-foreground">₽32,000</p>
                  <p className="text-xs text-muted-foreground mt-1">1 transaction</p>
                </Card>

                <Card className="p-6 bg-card border-border">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon name="CheckCircle2" size={20} className="text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">Paid</p>
                  </div>
                  <p className="text-3xl font-bold text-foreground">₽305,000</p>
                  <p className="text-xs text-muted-foreground mt-1">4 transactions</p>
                </Card>

                <Card className="p-6 bg-card border-border">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                      <Icon name="BarChart3" size={20} className="text-orange-500" />
                    </div>
                    <p className="text-sm text-muted-foreground">Avg. Deal</p>
                  </div>
                  <p className="text-3xl font-bold text-foreground">₽67,400</p>
                  <p className="text-xs text-muted-foreground mt-1">Per project</p>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card className="bg-card border-border p-6">
                  <h3 className="text-xl font-serif font-bold text-foreground mb-6">Revenue Trend</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={monthlyRevenue}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          color: 'hsl(var(--foreground))'
                        }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        fill="url(#revenueGradient)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>

                <Card className="bg-card border-border p-6">
                  <h3 className="text-xl font-serif font-bold text-foreground mb-6">Model Performance</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={modelPerformance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          color: 'hsl(var(--foreground))'
                        }} 
                      />
                      <Bar dataKey="earnings" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>

              <Card className="bg-card border-border">
                <div className="p-6 border-b border-border">
                  <h3 className="text-xl font-serif font-bold text-foreground">Recent Transactions</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-secondary/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Date</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Model</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Project</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Amount</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction) => (
                        <tr key={transaction.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                          <td className="px-6 py-4 text-sm text-muted-foreground">{transaction.date}</td>
                          <td className="px-6 py-4 text-sm text-foreground font-medium">{transaction.model}</td>
                          <td className="px-6 py-4 text-sm text-foreground">{transaction.project}</td>
                          <td className="px-6 py-4 text-sm text-foreground font-semibold">₽{transaction.amount.toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <Badge 
                              className={transaction.status === 'Paid' 
                                ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30' 
                                : 'bg-orange-500/20 text-orange-500 hover:bg-orange-500/30'}
                            >
                              {transaction.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'checks' && (
            <div className="animate-fade-in">
              <h2 className="text-4xl font-serif font-bold mb-6 text-foreground">Чеки</h2>
              <p className="text-muted-foreground">Section coming soon...</p>
            </div>
          )}

          {activeTab === 'schedule' && (
            <div className="animate-fade-in">
              <h2 className="text-4xl font-serif font-bold mb-6 text-foreground">Расписание</h2>
              <p className="text-muted-foreground">Section coming soon...</p>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="animate-fade-in">
              <h2 className="text-4xl font-serif font-bold mb-6 text-foreground">Dashboard</h2>
              <p className="text-muted-foreground">Section coming soon...</p>
            </div>
          )}

          {activeTab === 'files' && (
            <div className="animate-fade-in">
              <h2 className="text-4xl font-serif font-bold mb-6 text-foreground">Файлы</h2>
              <p className="text-muted-foreground">Section coming soon...</p>
            </div>
          )}

          {activeTab === 'users' && <UserManagement />}

          {activeTab === 'audit' && <AuditLog />}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;