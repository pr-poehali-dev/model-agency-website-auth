import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

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

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('models');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">MBA Corp.</h1>
            <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">Professional Models Agency</p>
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
      </header>

      <div className="flex">
        <aside className="w-64 min-h-screen bg-card border-r border-border">
          <nav className="p-4 space-y-2">
            {[
              { id: 'home', label: 'Главная', icon: 'Home' },
              { id: 'models', label: 'Модели', icon: 'Users' },
              { id: 'checks', label: 'Чеки', icon: 'Receipt' },
              { id: 'schedule', label: 'Расписание', icon: 'Calendar' },
              { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
              { id: 'files', label: 'Файлы', icon: 'FolderOpen' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
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
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
