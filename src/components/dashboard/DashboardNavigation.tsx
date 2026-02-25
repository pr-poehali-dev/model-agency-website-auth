import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { ROLE_LABELS, type UserRole } from '@/lib/permissions';
import NotificationBell from '@/components/NotificationBell';


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
  return (
    <>
      <aside className={`fixed left-0 top-0 h-full bg-card border-r border-border z-50 transition-transform duration-300 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 w-64 flex flex-col`}>
        <div className="p-6 border-b border-border">
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
        
        <nav className="flex-1 p-4 overflow-y-auto">
          {navigationItems.map((item) => {
            if (!userPermissions.includes(item.permission)) return null;
            if (item.id === 'models' && userRole === 'content_maker') return null;
            return (
              <Button
                key={item.id}
                variant={activeTab === item.id ? 'default' : 'ghost'}
                className="w-full justify-start mb-2"
                onClick={() => onTabChange(item.id)}
              >
                <Icon name={item.icon} size={20} className="mr-3" />
                {item.label}
              </Button>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-border space-y-2">
          <div className="flex items-center justify-between px-2 mb-1">
            <span className="text-xs text-muted-foreground">Уведомления</span>
            <NotificationBell userRole={userRole || undefined} userEmail={userEmail} onTaskClick={() => onTabChange('tasks')} />
          </div>
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

      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-40 flex items-center justify-between px-4">
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