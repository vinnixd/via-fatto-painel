import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Palette,
  Building2,
  Globe,
  MessageSquare,
  User,
  Users,
  ChevronLeft,
  ChevronRight,
  LogOut,
  CreditCard,
  Plug,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useSiteConfig } from '@/hooks/useSupabaseData';

interface MenuItem {
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
  roles?: ('admin' | 'gestor' | 'marketing' | 'corretor')[];
}

const menuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: Palette, label: 'Designer', path: '/admin/designer' },
  { icon: Building2, label: 'Imóveis', path: '/admin/imoveis' },
  { icon: Globe, label: 'Portais', path: '/admin/portais', roles: ['admin', 'gestor', 'marketing'] },
  { icon: Plug, label: 'Integrações', path: '/admin/integracoes', roles: ['admin', 'marketing'] },
  { icon: CreditCard, label: 'Assinaturas', path: '/admin/assinaturas', roles: ['admin'] },
  { icon: MessageSquare, label: 'Mensagens', path: '/admin/mensagens' },
  { icon: Users, label: 'Usuários', path: '/admin/usuarios', roles: ['admin'] },
];

const profileItem: MenuItem = { icon: User, label: 'Meu Perfil', path: '/admin/perfil' };

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const AdminSidebar = ({ collapsed, onToggle }: AdminSidebarProps) => {
  const location = useLocation();
  const { signOut, user, isAdmin, isGestor, isMarketing, isCorretor } = useAuth();
  const { data: siteConfig } = useSiteConfig();

  // Filter menu items based on user role
  const visibleMenuItems = menuItems.filter((item) => {
    if (!item.roles) return true;
    if (isAdmin && item.roles.includes('admin')) return true;
    if (isGestor && item.roles.includes('gestor')) return true;
    if (isMarketing && item.roles.includes('marketing')) return true;
    if (isCorretor && item.roles.includes('corretor')) return true;
    return false;
  });

  const isProfileActive = location.pathname === profileItem.path;

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 z-50 flex flex-col',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
          <Link to="/admin" className="flex items-center gap-2">
            {(siteConfig?.logo_horizontal_url || siteConfig?.logo_url) ? (
              <img 
                src={siteConfig.logo_horizontal_url || siteConfig.logo_url} 
                alt="Via Fatto Imóveis" 
                className="h-10 w-auto object-contain brightness-0 invert"
              />
            ) : (
              <>
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-lg">Via Fatto</span>
              </>
            )}
          </Link>
        )}
        {collapsed && (
          <Link to="/admin" className="mx-auto">
            {(siteConfig?.logo_symbol_url || siteConfig?.logo_url) ? (
              <img 
                src={siteConfig.logo_symbol_url || siteConfig.logo_url} 
                alt="Via Fatto Imóveis" 
                className="h-8 w-8 object-contain brightness-0 invert"
              />
            ) : (
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </div>
            )}
          </Link>
        )}
      </div>

      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className={cn(
          'absolute top-4 -right-3 h-6 w-6 rounded-full bg-sidebar-accent border border-sidebar-border text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent z-50',
        )}
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 overflow-y-auto">
        <ul className="space-y-1">
          {visibleMenuItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/admin' && location.pathname.startsWith(item.path));
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                    collapsed && 'justify-center px-0',
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-foreground'
                      : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent'
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span className="font-medium">{item.label}</span>}
                </Link>
              </li>
            );
          })}

          {/* Profile - Always Last */}
          <li>
            <Link
              to={profileItem.path}
              title={collapsed ? profileItem.label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                collapsed && 'justify-center px-0',
                isProfileActive
                  ? 'bg-sidebar-accent text-sidebar-foreground'
                  : 'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent'
              )}
            >
              <profileItem.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span className="font-medium">{profileItem.label}</span>}
            </Link>
          </li>
        </ul>
      </nav>

      {/* Version & Logout */}
      <div className="border-t border-sidebar-border p-4">
        {!collapsed && (
          <div className="mb-3 text-xs text-sidebar-muted">
            v1.0.0
          </div>
        )}
        <Button
          variant="ghost"
          onClick={signOut}
          title={collapsed ? 'Sair' : undefined}
          className={cn(
            'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent',
            collapsed ? 'w-full justify-center px-0' : 'w-full justify-start'
          )}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="ml-3">Sair</span>}
        </Button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
