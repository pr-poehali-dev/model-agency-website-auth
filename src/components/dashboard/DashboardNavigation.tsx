import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { ROLE_LABELS, type UserRole } from '@/lib/permissions';
import NotificationBell from '@/components/NotificationBell';
import { useNavigate } from 'react-router-dom';


interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  permission: string;
}

interface DashboardNavigationProps {
  activeTab: string;
  navigationItems: NavigationItem[];
  userPermissions: string[];
  userEmail: string;
  userName: string;
  userRole: UserRole | null;
  userPhotoUrl?: string;
  theme: 'light' | 'dark';
  mobileMenuOpen: boolean;
  onTabChange: (tabId: string) => void;
  onToggleTheme: () => void;
  onLogout: () => void;
  onToggleMobileMenu: () => void;
}

const DashboardNavigation = ({
  activeTab,
  navigationItems,
  userPermissions,
  userEmail,
  userName,
  userRole,
  userPhotoUrl,
  theme,
  mobileMenuOpen,
  onTabChange,
  onToggleTheme,
  onLogout,
  onToggleMobileMenu
}: DashboardNavigationProps) => {
  const navigate = useNavigate();
  return (
    <>
      <aside className={`fixed left-0 top-0 h-full glass-strong border-r border-white/10 z-50 transition-transform duration-300 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 w-64 flex flex-col overflow-hidden`}>
        <div className="pointer-events-none absolute -top-32 -left-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 -right-20 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
        <div className="relative p-6 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-serif font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">MBA</h1>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={onToggleMobileMenu}>
              <Icon name="X" size={20} />
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage loading="lazy" src={userPhotoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${userName || userEmail}`} />
              <AvatarFallback>{(userName || userEmail).slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{userName || userEmail}</p>
              {userRole && (
                <Badge variant="secondary" className="text-xs mt-1">
                  {ROLE_LABELS[userRole]}
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <nav className="relative flex-1 p-4 overflow-y-auto">
          {navigationItems.map((item) => {
            if (!userPermissions.includes(item.permission)) return null;
            if (item.id === 'models' && userRole === 'content_maker') return null;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`relative w-full flex items-center justify-start gap-3 px-4 py-2.5 mb-2 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-primary/25 to-accent/15 text-primary border border-primary/40 shadow-[0_4px_24px_-6px_hsl(var(--primary)/0.5)]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.06] border border-transparent'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-1 rounded-r-full bg-gradient-to-b from-primary to-accent shadow-[0_0_12px_hsl(var(--primary))]" />
                )}
                <Icon name={item.icon} size={20} className={isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'} />
                {item.label}
              </button>
            );
          })}
        </nav>
        
        <div className="relative p-4 border-t border-white/10 space-y-2">
          <div className="flex items-center justify-between px-2 mb-1">
            <span className="text-xs text-muted-foreground">Уведомления</span>
            <NotificationBell userRole={userRole || undefined} userEmail={userEmail} onTaskClick={() => onTabChange('tasks')} />
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/profile')} className="w-full justify-start">
            <Icon name="UserCircle" size={18} className="mr-2" />
            Мой профиль
          </Button>
          <Button variant="ghost" size="sm" onClick={onToggleTheme} className="w-full justify-start">
            <Icon name={theme === 'dark' ? 'Sun' : 'Moon'} size={18} className="mr-2" />
            {theme === 'dark' ? 'Светлая' : 'Темная'}
          </Button>
          <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={onLogout}>
            <Icon name="LogOut" size={20} className="mr-3" />
            Выход
          </Button>
        </div>
      </aside>

      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 glass-strong border-b border-white/10 z-40 flex items-center justify-between px-4">
        <Button variant="ghost" size="icon" onClick={onToggleMobileMenu}>
          <Icon name="Menu" size={24} />
        </Button>
        <h1 className="text-xl font-serif font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          MBA
        </h1>
        <NotificationBell userRole={userRole || undefined} userEmail={userEmail} onTaskClick={() => onTabChange('tasks')} />
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden" onClick={onToggleMobileMenu} />
      )}
    </>
  );
};

export default DashboardNavigation;